#!/usr/bin/env python3
"""Gera o banner Open Graph 1200x630 com fotos e marca locais da Escola Peralta.

Execução: python -m pip install pillow && python scripts/generate-social-card.py
A imagem é um arquivo estático (JPEG) servido no mesmo domínio da escola.
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PHOTO = ROOT / "public/images/school/hero-escola.webp"
LOGO = ROOT / "public/images/brand/escola-peralta-logo-refinada.png"
OUTPUT = ROOT / "public/images/social/escola-peralta-compartilhar.jpg"

W, H = 1200, 630
INK = "#20324a"
BLUE = "#2353a0"
GREEN = "#2d604d"
YELLOW = "#f2ce55"
PAPER = "#fff9ee"
CORAL = "#b64734"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)

def ellipse(draw: ImageDraw.ImageDraw, bounds: tuple[int, int, int, int], color: str):
    draw.ellipse(bounds, fill=color)

def star(draw: ImageDraw.ImageDraw, x: int, y: int, radius: int, color: str) -> None:
    r=radius
    draw.polygon(
        [(x,y-r),(x+int(r*.30),y-int(r*.3)),(x+r,y),
         (x+int(r*.3),y+int(r*.3)),(x,y+r),
         (x-int(r*.3),y+int(r*.3)),(x-r,y),
         (x-int(r*.3),y-int(r*.3))],
        fill=color,
    )

def build() -> None:
    if not PHOTO.is_file():
        raise FileNotFoundError(f"Foto oficial ausente: {PHOTO}")
    if not LOGO.is_file():
        raise FileNotFoundError(f"Logo oficial ausente: {LOGO}")
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    image=Image.new("RGB",(W,H),PAPER)
    draw=ImageDraw.Draw(image)
    # Elementos lúdicos nas bordas, mantendo a área do texto limpa.
    draw.ellipse((-170,435,300,940),fill="#f9ebc4")
    draw.ellipse((455,-300,805,160),fill="#e2f0e0")
    for x,y,r,c in [(522,88,16,CORAL),(502,565,18,BLUE),(1150,46,16,YELLOW)]:
        star(draw,x,y,r,c)

    # Moldura fotográfica com cantos arredondados e contorno colorido.
    photo_box=(622,34,1181,595)
    draw.rounded_rectangle((photo_box[0]-8,photo_box[1]-8,photo_box[2]+8,photo_box[3]+8),
                           radius=51,fill=BLUE)
    with Image.open(PHOTO) as src:
        fitted=ImageOps.fit(src.convert("RGB"),
                            (photo_box[2]-photo_box[0],photo_box[3]-photo_box[1]),
                            method=Image.Resampling.LANCZOS,centering=(.5,.45))
        mask=Image.new("L",fitted.size,0)
        ImageDraw.Draw(mask).rounded_rectangle((0,0,*fitted.size),radius=44,fill=255)
        image.paste(fitted,photo_box[:2],mask)

    # Etiqueta pequena sobre a foto; contraste garantido sem cobrir rostos.
    draw.rounded_rectangle((834,531,1153,578),radius=20,fill=PAPER)
    draw.text((855,541),"GRAVATÁ · PERNAMBUCO",font=font(18,True),fill=INK)

    # Marca transparente (não recriar logo ou alterar os traços).
    with Image.open(LOGO) as src:
        logo=src.convert("RGBA")
        logo.thumbnail((117,117),Image.Resampling.LANCZOS)
        image.paste(logo,(59,29),logo)
    draw=ImageDraw.Draw(image)
    draw.text((181,59),"ESCOLA",font=font(25,True),fill=GREEN)
    draw.text((181,88),"PERALTA",font=font(29,True),fill=INK)
    draw.line((60,159,537,159),fill="#deded0",width=2)

    # Hierarquia principal: curta e legível mesmo em miniatura no WhatsApp.
    draw.text((56,196),"Um mundo de",font=font(56,True),fill=INK,stroke_width=0)
    draw.text((56,267),"descobertas.",font=font(59,True),fill=BLUE,stroke_width=0)
    draw.rounded_rectangle((60,356,192,362),radius=3,fill=CORAL)

    draw.text((60,396),"EDUCAÇÃO INFANTIL",font=font(24,True),fill=INK)
    draw.text((60,435),"E ENSINO FUNDAMENTAL I",font=font(22,True),fill=INK)
    draw.text((60,500),"Aprender · Brincar · Conviver",font=font(19),fill=GREEN)
    draw.text((60,528),"Crescer com carinho.",font=font(19),fill=GREEN)

    # Salvar otimizado: JPEG compatível com preview de apps sociais.
    image.save(OUTPUT,format="JPEG",quality=90,subsampling=0,optimize=True,progressive=False)
    check=Image.open(OUTPUT)
    if check.size!=(1200,630) or check.format!="JPEG":
        raise RuntimeError("Banner gerado fora das especificações")
    print(f"OK {OUTPUT.relative_to(ROOT)} {OUTPUT.stat().st_size} bytes ({check.width}x{check.height})")

if __name__=="__main__":
    build()
