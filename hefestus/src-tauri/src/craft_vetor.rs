//! Ferramentas do Craft (FigCraft) expostas ao Hefestus.
//! Os caminhos entram e saem como o atributo `d` do SVG, o mesmo formato que o Hefestus já usa
//! (js/nucleo/vetor.js: escreverCaminho / lerCaminho).

use figcraft_doc::{BoolOp, StrokeAlign, StrokeCap, StrokeJoin, StrokeProps};
use figcraft_geom::kurbo::BezPath;

fn operacao(nome: &str) -> Result<BoolOp, String> {
    match nome {
        "unir" => Ok(BoolOp::Union),
        "subtrair" => Ok(BoolOp::Subtract),
        "intersectar" => Ok(BoolOp::Intersect),
        "excluir" => Ok(BoolOp::Exclude),
        _ => Err(format!("Operação desconhecida: {nome}")),
    }
}

fn ler(d: &str) -> Result<BezPath, String> {
    BezPath::from_svg(d).map_err(|e| format!("Caminho SVG inválido: {e:?}"))
}

/// União, subtração, interseção ou exclusão entre 2 ou mais caminhos, na ordem de baixo para cima
/// (o primeiro é a base). As curvas saem exatas, sem virar polilinha. Regra de preenchimento: par-ímpar.
pub fn booleana(caminhos: &[String], nome_op: &str) -> Result<String, String> {
    if caminhos.len() < 2 {
        return Err("São necessários pelo menos 2 caminhos.".into());
    }
    let op = operacao(nome_op)?;
    let fechados = caminhos
        .iter()
        .map(|d| ler(d).map(|p| figcraft_pathops::closed(&p)))
        .collect::<Result<Vec<_>, _>>()?;
    let resultado = figcraft_pathops::boolean(&fechados, op).map_err(|e| e.to_string())?;
    Ok(resultado.to_svg())
}

/// Traço do Hefestus (estilo.tracos ou a borda simples), com os nomes que o Hefestus usa.
#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Traco {
    pub largura: f64,
    /// "dentro" | "centro" | "fora"
    pub posicao: String,
    /// "reta" | "redonda" | "quadrada"
    pub ponta: String,
    /// "reta" | "redonda" | "chanfrada"
    pub juncao: String,
    /// Tracejado: traço, vão, traço, vão… (vazio = contínuo)
    #[serde(default)]
    pub tracejado: Vec<f64>,
    /// O caminho é fechado? (dentro/fora só valem para formas fechadas)
    pub fechado: bool,
}

fn propriedades_do_traco(t: &Traco) -> StrokeProps {
    let ponta = match t.ponta.as_str() {
        "redonda" => StrokeCap::Round,
        "quadrada" => StrokeCap::Square,
        _ => StrokeCap::None,
    };
    StrokeProps {
        weight: t.largura,
        align: match t.posicao.as_str() {
            "dentro" => StrokeAlign::Inside,
            "fora" => StrokeAlign::Outside,
            _ => StrokeAlign::Center,
        },
        cap_start: ponta,
        cap_end: ponta,
        join: match t.juncao.as_str() {
            "redonda" => StrokeJoin::Round,
            "chanfrada" => StrokeJoin::Bevel,
            _ => StrokeJoin::Miter,
        },
        dashes: t
            .tracejado
            .iter()
            .copied()
            .filter(|v| v.is_finite() && *v >= 0.0)
            .collect(),
        ..StrokeProps::default()
    }
}

/// "Converter traço em forma": a área pintada pelo traço vira um caminho preenchido
/// (par-ímpar), respeitando posição, pontas, junções e tracejado.
pub fn contornar_traco(d: &str, traco: &Traco) -> Result<String, String> {
    if !(traco.largura.is_finite() && traco.largura > 0.0) {
        return Err("O traço precisa ter largura maior que zero.".into());
    }
    let caminho = ler(d)?;
    let contorno =
        figcraft_pathops::stroke_outline(&caminho, &propriedades_do_traco(traco), traco.fechado);
    if contorno.elements().is_empty() {
        return Err("O traço ficou vazio.".into());
    }
    let limpo = figcraft_pathops::simplify(&contorno).unwrap_or(contorno);
    Ok(limpo.to_svg())
}

/// Nomes das ferramentas do Craft disponíveis neste motor (aparecem em info_motor).
pub const FERRAMENTAS: &[&str] = &[
    "booleana (FigCraft pathops)",
    "converter traço em forma (FigCraft pathops)",
];

#[cfg(test)]
mod testes {
    use super::*;

    const A: &str = "M0 0L100 0L100 100L0 100Z";
    const B: &str = "M50 50L150 50L150 150L50 150Z";

    #[test]
    fn uniao_de_dois_quadrados_sai_nao_vazia() {
        let d = booleana(&[A.into(), B.into()], "unir").unwrap();
        let p = BezPath::from_svg(&d).unwrap();
        assert!(!p.elements().is_empty());
    }

    #[test]
    fn subtrair_tira_o_canto() {
        let d = booleana(&[A.into(), B.into()], "subtrair").unwrap();
        assert!(!d.is_empty());
    }

    fn traco(posicao: &str, fechado: bool) -> Traco {
        Traco {
            largura: 10.0,
            posicao: posicao.into(),
            ponta: "redonda".into(),
            juncao: "reta".into(),
            tracejado: vec![],
            fechado,
        }
    }

    #[test]
    fn traco_de_quadrado_vira_anel() {
        for posicao in ["dentro", "centro", "fora"] {
            let d = contornar_traco(A, &traco(posicao, true)).unwrap();
            assert!(
                BezPath::from_svg(&d).unwrap().elements().len() > 4,
                "{posicao}"
            );
        }
    }

    #[test]
    fn traco_de_linha_aberta_e_tracejado() {
        let mut t = traco("centro", false);
        t.tracejado = vec![20.0, 10.0];
        assert!(!contornar_traco("M0 0L200 0", &t).unwrap().is_empty());
    }

    #[test]
    fn traco_sem_largura_da_erro() {
        let mut t = traco("centro", true);
        t.largura = 0.0;
        assert!(contornar_traco(A, &t).is_err());
    }

    #[test]
    fn operacao_invalida_da_erro() {
        assert!(booleana(&[A.into(), B.into()], "misturar").is_err());
        assert!(booleana(&[A.into()], "unir").is_err());
    }
}
