# Portfolio Page

Portfólio pessoal estático, com foco em apresentação de projetos, hobbies/interesses e contacto.

## Demo

- Produção: https://portfolio.rivodani.com

## Funcionalidades

- Interface single-page com secções: Hero, Projetos, Hobbies e Contacto
- Fundo 3D animado com ajuste automático de qualidade por dispositivo
- Carrosséis de projetos com autoplay, controlo manual e navegação por teclado
- Lightbox para visualização ampliada de imagens/SVG
- Internacionalização PT/EN com ficheiros JSON
- Persistência de idioma no localStorage e parâmetro de URL ?l=pt|en
- Formulário de contacto com proteção anti-spam (honeypot + tempo mínimo)
- Botão de email com fallback modal para cópia de endereço/assunto
- SEO técnico com metadados dinâmicos por idioma e JSON-LD
- Imagens otimizadas com AVIF/WebP + fallback PNG

## Stack

- HTML5
- CSS3 (arquivo único)
- JavaScript vanilla
- Three.js (CDN)
- Font Awesome (CDN)
- Google Fonts (CDN)

## Estrutura do Repositório

```text
.
├─ index.html
├─ CNAME
├─ assets/
│  ├─ css/main.css
│  ├─ js/main.js
│  ├─ i18n/
│  │  ├─ pt.json
│  │  └─ en.json
│  └─ images/
```

## Desenvolvimento Local

Como o site usa fetch para carregar traduções JSON, evita abrir o HTML diretamente com file://. Usa um servidor local.

### Opção 1: Python

```bash
python -m http.server 5500
```

Abrir: http://localhost:5500

### Opção 2: Node.js (serve)

```bash
npx serve .
```

## Internacionalização

As traduções estão em:

- assets/i18n/pt.json
- assets/i18n/en.json

Para adicionar novo texto:

1. Adiciona a chave nos dois JSON
2. Usa data-i18n="chave" no HTML
3. O script aplica a tradução automaticamente

