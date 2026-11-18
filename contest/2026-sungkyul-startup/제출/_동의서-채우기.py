"""학교가 준 개인정보 수집·이용 동의서(HWPX)를 사람마다 한 부씩 채운다.

양식은 그대로 두고 빈 칸에 글자만 넣는다(HWPX 안의 XML을 직접 고친다. 한글 프로그램을 쓰지 않는다).
사용: python -X utf8 -I _동의서-채우기.py
"""
import json
import pathlib
import re
import zipfile

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE.parent / "원본" / "개인정보 수집 및 활용 동의서.hwpx"
info = json.loads((HERE / "개인정보.json").read_text(encoding="utf-8"))
month, day = info["date"]["month"], info["date"]["day"]


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def fill(xml, person):
    # 인적사항 표: 값 칸(colAddr=2, rowAddr=1~4)의 빈 run에 글자를 넣는다
    values = {1: person["name"], 2: person["dept"], 3: person["id"], 4: person["phone"]}
    for row, val in values.items():
        if not val:
            continue
        pat = re.compile(
            r'(<hp:tc [^>]*>(?:(?!</hp:tc>).)*?)<hp:run charPrIDRef="(\d+)"/>((?:(?!</hp:tc>).)*?<hp:cellAddr colAddr="2" rowAddr="%d"/>)' % row,
            re.S,
        )
        xml, n = pat.subn(lambda m: f'{m.group(1)}<hp:run charPrIDRef="{m.group(2)}"><hp:t>{esc(val)}</hp:t></hp:run>{m.group(3)}', xml, count=1)
        assert n == 1, f"값 칸을 못 찾음: row {row}"
    for a, b in [
        ("□ 예", "■ 예"),
        ("2026년    월   일", f"2026년  {month}월  {day}일"),
        ("성명           (인)", f"성명   {person['name']}    (인)"),
    ]:
        assert xml.count(a) == 1, f"글자를 못 찾음: {a}"
        xml = xml.replace(a, b)
    return xml


with zipfile.ZipFile(SRC) as z:
    names = z.namelist()
    data = {n: z.read(n) for n in names}
    infos = {n: z.getinfo(n) for n in names}

for person in info["people"]:
    out = HERE / f"개인정보 수집 및 활용 동의서_{person['name']}.hwpx"
    section = fill(data["Contents/section0.xml"].decode("utf-8"), person)
    with zipfile.ZipFile(out, "w") as z:
        # mimetype은 맨 앞에 압축 없이 둔다(HWPX·OPC 규칙). 나머지는 원본과 같은 방식으로.
        for n in names:
            body = section.encode("utf-8") if n == "Contents/section0.xml" else data[n]
            ct = zipfile.ZIP_STORED if n == "mimetype" else infos[n].compress_type
            z.writestr(zipfile.ZipInfo(n, date_time=infos[n].date_time), body, compress_type=ct)
    print("saved", out.name, "학과 비어 있음" if not person["dept"] else "")
