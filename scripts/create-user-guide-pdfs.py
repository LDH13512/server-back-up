"""Create the three Korean Arcade Board user-guide PDFs from the approved guide."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "output" / "pdf"
FONT_PATH = Path(r"C:\Windows\Fonts\malgun.ttf")
FONT_BOLD_PATH = Path(r"C:\Windows\Fonts\malgunsl.ttf")

TEAL = colors.HexColor("#0F8F89")
TEAL_DARK = colors.HexColor("#0B645F")
INK = colors.HexColor("#172033")
MUTED = colors.HexColor("#5B6B84")
SURFACE = colors.HexColor("#F4FBFA")
LINE = colors.HexColor("#D7E9E7")
NOTICE = colors.HexColor("#FFF7E5")
NOTICE_TEXT = colors.HexColor("#7A4D00")


GUIDES = [
    {
        "filename": "오락실_이용방법_단기_컨텐츠.pdf",
        "eyebrow": "ARCADE BOARD USER GUIDE",
        "title": "단기 컨텐츠 이용방법",
        "subtitle": "하루 미만으로 함께 즐기는 게임을 빠르게 초대하고 약속하는 방법",
        "audience": "대상: 일반 회원과 게스트 회원 모두",
        "steps": [
            (
                "게스트 초대석 채널을 이용하세요",
                "함께할 사람에게 전시용 게시판 주소를 공유하고, 게임 약속에 필요한 내용을 안내해 주세요.",
            ),
            (
                "게시판에서 게임 약속을 확인하세요",
                "모집 카드에서 게임 이름, 시작 시간, 현재 인원과 함께할 사람을 확인합니다. 필요한 경우 파티 합류하기로 참가할 수 있습니다.",
            ),
            (
                "약속 시간에 함께 게임을 시작하세요",
                "정해진 시간에 함께 게임을 즐기면 됩니다. 일정이나 인원이 바뀌면 모집글도 함께 수정해 주세요.",
            ),
        ],
        "notice": "개인 연락처나 비밀번호 같은 민감한 정보는 게시판과 공개 채팅에 적지 마세요.",
    },
    {
        "filename": "오락실_이용방법_장기_컨텐츠_게스트용.pdf",
        "eyebrow": "ARCADE BOARD USER GUIDE",
        "title": "장기 컨텐츠 게스트 안내",
        "subtitle": "하루 이상 함께하는 게임에 게스트로 참여하는 방법",
        "audience": "대상: 게스트 회원",
        "steps": [
            (
                "게시판용 닉네임을 정하세요",
                "개인정보가 포함되지 않고 참가자를 알아볼 수 있는 전시용 닉네임을 정해 주세요.",
            ),
            (
                "가입한 게시판 게임방에 참여하세요",
                "참여할 게임 카드를 열고 파티 합류하기를 누른 뒤 앞에서 정한 닉네임을 입력해 주세요.",
            ),
            (
                "참가 일정을 확인하세요",
                "참가자 목록과 희망 날짜를 확인하고 함께 플레이할 시간을 정해 주세요.",
            ),
        ],
        "notice": "입장 오류가 나면 닉네임 형식을 먼저 확인한 뒤, 일반 회원을 통해 운영진에게 권한을 요청해 주세요.",
    },
    {
        "filename": "오락실_이용방법_장기_컨텐츠_일반회원용.pdf",
        "eyebrow": "ARCADE BOARD USER GUIDE",
        "title": "장기 컨텐츠 이용방법 - 일반 회원",
        "subtitle": "게스트와 함께하는 장기 게임을 모집하고 안내하는 방법",
        "audience": "대상: 일반 회원",
        "steps": [
            (
                "게스트의 게시판 닉네임을 먼저 정하세요",
                "초대한 게스트와 개인정보가 포함되지 않은 전시용 닉네임을 정해 주세요.",
            ),
            (
                "게시판에서 같은 닉네임으로 파티에 등록하세요",
                "모집 중인 카드를 열고 파티 합류하기를 누른 뒤, 앞에서 정한 게스트 닉네임을 입력합니다.",
            ),
            (
                "생성된 게시판 게임방에서 함께 즐기세요",
                "일정이 확정되면 모집글을 최신 상태로 유지하고 정해진 시간에 함께 게임을 즐기세요.",
            ),
        ],
        "notice": "게시판이 만든 파티 음성 채널은 14일 이상 음성 사용 기록이 없으면 자동으로 삭제됩니다.",
    },
]


def register_fonts():
    if not FONT_PATH.exists() or not FONT_BOLD_PATH.exists():
        raise FileNotFoundError("맑은 고딕 글꼴을 찾을 수 없습니다.")
    pdfmetrics.registerFont(TTFont("MalgunGothic", str(FONT_PATH)))
    pdfmetrics.registerFont(TTFont("MalgunGothicBold", str(FONT_BOLD_PATH)))


def header_footer(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.7)
    canvas.line(18 * mm, height - 16 * mm, width - 18 * mm, height - 16 * mm)
    canvas.setFont("MalgunGothicBold", 8)
    canvas.setFillColor(TEAL)
    canvas.drawString(18 * mm, height - 12 * mm, "게시판")
    canvas.setFont("MalgunGothic", 8)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(width - 18 * mm, 12 * mm, "오락실 이용방법")
    canvas.restoreState()


def make_styles():
    styles = getSampleStyleSheet()
    return {
        "eyebrow": ParagraphStyle(
            "GuideEyebrow",
            parent=styles["Normal"],
            fontName="MalgunGothicBold",
            fontSize=8.5,
            leading=12,
            textColor=TEAL,
            spaceAfter=6,
        ),
        "title": ParagraphStyle(
            "GuideTitle",
            parent=styles["Normal"],
            fontName="MalgunGothicBold",
            fontSize=24,
            leading=34,
            textColor=INK,
            spaceAfter=8,
        ),
        "subtitle": ParagraphStyle(
            "GuideSubtitle",
            parent=styles["Normal"],
            fontName="MalgunGothic",
            fontSize=11,
            leading=18,
            textColor=MUTED,
        ),
        "audience": ParagraphStyle(
            "GuideAudience",
            parent=styles["Normal"],
            fontName="MalgunGothicBold",
            fontSize=9.5,
            leading=15,
            textColor=TEAL_DARK,
        ),
        "number": ParagraphStyle(
            "GuideNumber",
            parent=styles["Normal"],
            fontName="MalgunGothicBold",
            fontSize=12,
            leading=18,
            alignment=TA_LEFT,
            textColor=colors.white,
        ),
        "step_title": ParagraphStyle(
            "GuideStepTitle",
            parent=styles["Normal"],
            fontName="MalgunGothicBold",
            fontSize=12,
            leading=18,
            textColor=INK,
            spaceAfter=3,
        ),
        "body": ParagraphStyle(
            "GuideBody",
            parent=styles["Normal"],
            fontName="MalgunGothic",
            fontSize=10,
            leading=17,
            textColor=MUTED,
        ),
        "notice": ParagraphStyle(
            "GuideNotice",
            parent=styles["Normal"],
            fontName="MalgunGothicBold",
            fontSize=9.5,
            leading=16,
            textColor=NOTICE_TEXT,
        ),
    }


def step_block(number, title, body, styles):
    circle = Table(
        [[Paragraph(str(number), styles["number"])]],
        colWidths=[9 * mm],
        rowHeights=[9 * mm],
    )
    circle.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), TEAL),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("BOX", (0, 0), (-1, -1), 0, colors.white),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    detail = [Paragraph(title, styles["step_title"]), Paragraph(body, styles["body"])]
    table = Table([[circle, detail]], colWidths=[15 * mm, 145 * mm])
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (-1, -1), SURFACE),
                ("BOX", (0, 0), (-1, -1), 0.7, LINE),
                ("LINEBELOW", (0, 0), (-1, -1), 0, colors.white),
                ("LEFTPADDING", (0, 0), (0, 0), 4 * mm),
                ("RIGHTPADDING", (0, 0), (0, 0), 1 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
                ("LEFTPADDING", (1, 0), (1, 0), 2 * mm),
                ("RIGHTPADDING", (1, 0), (1, 0), 5 * mm),
            ]
        )
    )
    return KeepTogether([table, Spacer(1, 5 * mm)])


def build_guide(guide, styles):
    output_path = OUTPUT_DIR / guide["filename"]
    document = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=25 * mm,
        bottomMargin=22 * mm,
        title=guide["title"],
        author="게시판",
    )
    story = [
        Paragraph(guide["eyebrow"], styles["eyebrow"]),
        Paragraph(guide["title"], styles["title"]),
        Paragraph(guide["subtitle"], styles["subtitle"]),
        Spacer(1, 6 * mm),
    ]
    audience = Table([[Paragraph(guide["audience"], styles["audience"])]], colWidths=[174 * mm])
    audience.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#E9F7F5")),
                ("BOX", (0, 0), (-1, -1), 0.7, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 3.5 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3.5 * mm),
            ]
        )
    )
    story.extend([audience, Spacer(1, 7 * mm)])
    for index, (title, body) in enumerate(guide["steps"], start=1):
        story.append(step_block(index, title, body, styles))
    notice = Table([[Paragraph(guide["notice"], styles["notice"])]], colWidths=[174 * mm])
    notice.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), NOTICE),
                ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#F2D793")),
                ("LEFTPADDING", (0, 0), (-1, -1), 5 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 4 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4 * mm),
            ]
        )
    )
    story.extend([Spacer(1, 2 * mm), notice])
    document.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
    return output_path


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    register_fonts()
    styles = make_styles()
    for guide in GUIDES:
        output_path = build_guide(guide, styles)
        print(output_path)


if __name__ == "__main__":
    main()
