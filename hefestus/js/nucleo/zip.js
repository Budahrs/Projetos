// ZIP sem compressão, UTF-8, utilizável no navegador sem dependências.
export function crc32(bytes) {let c=0xffffffff;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
/** Leitor limitado aos pacotes sem compressão produzidos por este editor. */
export function lerZIP(bytes) {
  const b=new Uint8Array(bytes),v=new DataView(b.buffer,b.byteOffset,b.byteLength),out={},decode=new TextDecoder('utf-8',{fatal:true});
  if(b.length<22||b.length>64*1024*1024||v.getUint32(b.length-22,true)!==0x06054b50)throw new Error('Pacote inválido ou maior que 64 MB.');
  const fim=b.length-22,quantidade=v.getUint16(fim+10,true),central=v.getUint32(fim+16,true);let p=0;
  if(quantidade>1000||central>fim||central+v.getUint32(fim+12,true)!==fim)throw new Error('Diretório ZIP inválido.');
  for(let i=0;i<quantidade;i++) {
    if(p+30>central||v.getUint32(p,true)!==0x04034b50||v.getUint16(p+8,true)!==0||v.getUint16(p+6,true)!==0x800)throw new Error('Abra um pacote ZIP salvo pelo Hefestus, sem recompressão.');
    const tamanho=v.getUint32(p+18,true),nomeLen=v.getUint16(p+26,true),extra=v.getUint16(p+28,true),inicio=p+30+nomeLen+extra,fimDado=inicio+tamanho;
    if(fimDado>central||tamanho!==v.getUint32(p+22,true))throw new Error('Arquivo truncado.');
    const nome=decode.decode(b.subarray(p+30,p+30+nomeLen));
    if(!nome||nome.startsWith('/')||nome.includes('\\')||nome.includes(':')||nome.split('/').some(n=>n==='..'||n==='.')||Object.hasOwn(out,nome))throw new Error('Caminho inválido no pacote.');
    const data=b.subarray(inicio,fimDado);if(crc32(data)!==v.getUint32(p+14,true))throw new Error('O pacote está corrompido.');
    Object.defineProperty(out,nome,{value:data,enumerable:true});p=fimDado;
  }
  if(p!==central)throw new Error('Conteúdo ZIP inconsistente.');return out;
}
export function criarZIP(arquivos) {
  const encoder=new TextEncoder(),partes=[],diretorio=[];let offset=0;
  const header=(n)=>{const b=new Uint8Array(n);return [b,new DataView(b.buffer)];};
  for(const [nome,conteudo]of Object.entries(arquivos)) {
    if(!nome||nome.startsWith('/')||nome.includes('\\')||nome.split('/').some(p=>p==='..'||p==='.')||nome.includes(':'))throw new Error('Caminho inválido no pacote.');
    const nb=encoder.encode(nome),data=typeof conteudo==='string'?encoder.encode(conteudo):new Uint8Array(conteudo),checksum=crc32(data);
    const [local,l]=header(30+nb.length);l.setUint32(0,0x04034b50,true);l.setUint16(4,20,true);l.setUint16(6,0x800,true);l.setUint16(12,0x21,true);l.setUint32(14,checksum,true);l.setUint32(18,data.length,true);l.setUint32(22,data.length,true);l.setUint16(26,nb.length,true);local.set(nb,30);
    const [central,c]=header(46+nb.length);c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x800,true);c.setUint16(14,0x21,true);c.setUint32(16,checksum,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,nb.length,true);c.setUint32(42,offset,true);central.set(nb,46);
    partes.push(local,data);diretorio.push(central);offset+=local.length+data.length;
  }
  const tamanhoCentral=diretorio.reduce((n,b)=>n+b.length,0),[fim,f]=header(22);f.setUint32(0,0x06054b50,true);f.setUint16(8,diretorio.length,true);f.setUint16(10,diretorio.length,true);f.setUint32(12,tamanhoCentral,true);f.setUint32(16,offset,true);
  const resultado=new Uint8Array(offset+tamanhoCentral+fim.length);let pos=0;for(const b of [...partes,...diretorio,fim]){resultado.set(b,pos);pos+=b.length;}return resultado;
}
