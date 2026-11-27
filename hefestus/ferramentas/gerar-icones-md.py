#!/usr/bin/env python3
"""Gera js/ui/icones-md.js a partir do Material Design Icons (Pictogrammers, Apache 2.0).
Uso: python3 ferramentas/gerar-icones-md.py <pasta com os .svg do MDI>
Cada ícone do MDI é um único <path> em 24×24 (preenchido)."""
import re, sys, json, pathlib
src = pathlib.Path(sys.argv[1])
CATS = {
 "Material · Arquivo": "file file-plus file-document file-outline file-export file-import file-download file-upload file-find file-multiple file-pdf-box file-excel file-word file-powerpoint file-image file-code file-cog file-lock file-check file-question folder folder-open folder-plus folder-outline folder-star folder-upload folder-download folder-search content-save content-save-outline content-save-all content-save-edit printer printer-eye export import download upload cloud-upload cloud-download cloud-sync cloud-check archive-outline",
 "Material · Edição": "undo redo undo-variant redo-variant content-cut content-copy content-paste content-duplicate pencil pencil-outline pencil-box eraser delete delete-outline delete-forever trash-can-outline select-all select select-off select-group select-inverse magnify magnify-plus magnify-minus find-replace format-text-variant spellcheck clipboard-text clipboard-outline history restore",
 "Material · Texto e fonte": "format-bold format-italic format-underline format-strikethrough format-font format-size format-color-text format-color-fill format-color-highlight format-align-left format-align-center format-align-right format-align-justify format-list-bulleted format-list-numbered format-indent-increase format-indent-decrease format-line-spacing format-header-1 format-header-2 format-paragraph format-quote-close format-clear format-superscript format-subscript text-box text-box-outline text format-letter-case",
 "Material · Navegação": "menu menu-open dots-vertical dots-horizontal home home-outline apps view-dashboard view-grid view-list view-agenda view-carousel view-column view-module view-sequential arrow-left arrow-right arrow-up arrow-down arrow-left-circle arrow-right-circle chevron-left chevron-right chevron-up chevron-down chevron-double-left chevron-double-right chevron-double-up chevron-double-down arrow-expand arrow-collapse arrow-expand-all fullscreen fullscreen-exit unfold-more-horizontal unfold-less-horizontal page-first page-last backburger forwardburger subdirectory-arrow-right table-of-contents sitemap dock-left dock-right dock-window page-layout-header page-layout-sidebar-left page-layout-sidebar-right page-layout-footer page-layout-body",
 "Material · Ações": "plus minus plus-circle minus-circle close close-circle check check-circle check-bold lock lock-open lock-outline eye eye-off eye-outline filter filter-outline filter-variant sort sort-ascending sort-descending rotate-left rotate-right rotate-3d flip-horizontal flip-vertical pin pin-outline refresh sync reload cached swap-horizontal swap-vertical play-circle stop-circle power toggle-switch toggle-switch-off checkbox-marked checkbox-blank-outline radiobox-marked radiobox-blank drag drag-variant resize arrow-all cursor-move cursor-default cursor-pointer hand-back-right",
 "Material · Conta e acesso": "account account-circle account-outline account-multiple account-plus account-minus account-group account-check account-edit account-cog account-key account-lock login logout key key-variant shield shield-check shield-lock shield-account cog cog-outline cogs tune tune-variant wrench wrench-outline hammer-wrench tools badge-account card-account-details fingerprint face-man",
 "Material · Comunicação": "email email-outline email-open send send-outline message message-text message-outline chat chat-outline comment comment-text comment-outline forum phone phone-outline cellphone bell bell-outline bell-ring bell-off share share-variant share-outline link link-variant link-off at paperclip bullhorn bullhorn-outline rss video video-outline microphone-outline headset",
 "Material · Mídia": "image image-outline image-multiple camera camera-outline play pause stop skip-next skip-previous fast-forward rewind volume-high volume-medium volume-low volume-off microphone microphone-off movie music television monitor monitor-dashboard laptop tablet cellphone-link projector slideshow",
 "Material · Estado e informação": "information information-outline alert alert-outline alert-circle alert-circle-outline alert-octagon help-circle help-circle-outline clock clock-outline timer timer-outline calendar calendar-today calendar-month calendar-clock star star-outline star-half-full heart heart-outline tag tag-outline map-marker map-marker-outline map wifi wifi-off lan lan-connect lan-disconnect server server-network database chart-bar chart-line chart-pie chart-areaspline chart-box finance gauge speedometer thermometer lightning-bolt flash bug check-network",
 "Material · Loja e negócios": "cart cart-outline basket shopping store storefront credit-card credit-card-outline wallet gift gift-outline cash currency-usd receipt tag-multiple sale briefcase briefcase-outline office-building domain bank handshake trophy medal certificate",
 "Material · Design": "palette palette-outline brush format-paint eyedropper layers layers-outline vector-square vector-polygon vector-line vector-curve vector-combine vector-union shape shape-outline shape-plus shape-square-plus ruler ruler-square grid grid-off border-all border-none border-radius blur opacity image-filter-vintage tune-vertical code-tags code-braces code-json xml language-html5 language-css3 language-javascript puzzle puzzle-outline bookmark bookmark-outline library bookshelf cube-outline cube view-in-ar auto-fix magic-staff",
 "Material · Formas": "circle circle-outline square square-outline rectangle rectangle-outline triangle triangle-outline hexagon hexagon-outline pentagon octagon rhombus rhombus-outline star-four-points star-circle heart-box cloud cloud-outline weather-night white-balance-sunny arrow-right-bold arrow-right-thick",
}
out, cats, faltou = {}, [], []
for nome, lista in CATS.items():
    itens = []
    for n in lista.split():
        f = src / f"{n}.svg"
        if not f.exists(): faltou.append(n); continue
        d = re.findall(r'<path d="([^"]+)"', f.read_text())
        if len(d) != 1: faltou.append(n + "(multi)"); continue
        out[f"md-{n}"] = d[0]; itens.append(f"md-{n}")
    cats.append({"nome": nome, "itens": itens})
js = ("// Gerado por ferramentas/gerar-icones-md.py — Material Design Icons (Pictogrammers), licença Apache 2.0.\n"
      "// Ícones preenchidos 24×24: cada nome começa com \"md-\".\n"
      f"export const ICONES_MD = {json.dumps(out, ensure_ascii=False, separators=(',', ':'))};\n"
      f"export const CATEGORIAS_MD = {json.dumps(cats, ensure_ascii=False)};\n")
pathlib.Path(__file__).resolve().parent.parent.joinpath("js/ui/icones-md.js").write_text(js)
print(len(out), "ícones;", len(js)//1024, "KB; faltaram:", faltou)
