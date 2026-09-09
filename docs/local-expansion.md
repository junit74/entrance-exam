# 7개 대학 로컬 추가 검증 기록

확인일: 2026-09-09 (2027학년도 수시 접수 중).

추가 7개 대학, 지역 표시와 경쟁률 추이 개선을 포함한다. 로컬 실행은 `npm start`, 주소는 http://localhost:4173 이다. 공개 사이트는 로컬 자동 수집·게시(`caffeinate -i npm run publish:watch`)와 GitHub Pages 배포를 통해 10분마다 최신 자료를 확인한다.

## 2027 모집 범위

기존 6개에 아래 7개를 추가하여 총 13개 대학이다. 논술 상세 표의 모집·지원 합계와 학과별 경쟁률을 검증한다. 중앙대는 원본 전체 합계를 먼저 검증한 뒤 다빈치캠퍼스만 추린다. 자연과학 제외는 화면 표·그래프에 적용하며, 학교 카드에는 선택한 학교/캠퍼스의 논술 전체가 표시된다.

| 대학 | 논술 모집단위 | 자연과학 제외 후 | 전체 모집인원 | 현재 경쟁률 원문 | 2027 요강 |
|---|---:|---:|---:|---|---|
| 강남대학교 | 16 | 16 | 309 | [지원현황](https://ratio.uwayapply.com/Sl5KTThXclc4OUpmJSY6Jko3ZlRm) | [모집요강](https://admission.kangnam.ac.kr/bbs/filedown.php?bbsid=paper&file_seq=4167) |
| 중앙대학교 다빈치캠퍼스 | 7 | 6 | 48 | [지원현황](https://ratio.uwayapply.com/Sl5KOjhMSmYlJjomSjdmVGY=) | [모집요강](https://admission.cau.ac.kr/file/pdfDown.pdf?sfn=20260805051607003_0c37226bf7e64ad79adafec6f6fdc72c.pdf&ofn=%ec%a4%91%ec%95%99%eb%8c%80%ed%95%99%ea%b5%90_2027%ed%95%99%eb%85%84%eb%8f%84+%ec%88%98%ec%8b%9c%eb%aa%a8%ec%a7%91%ec%9a%94%ea%b0%95_%ec%97%85%eb%a1%9c%eb%93%9c%ec%9a%a9(%ec%b5%9c%ec%a2%85).pdf) |
| 한신대학교 | 23 | 21 | 231 | [지원현황](https://addon.jinhakapply.com/RatioV1/RatioH/Ratio11630451.html) | [모집요강](https://ent.hs.ac.kr/upload_data/mojib/RF(0)_26052893427.pdf) |
| 인하대학교 | 48 | 41 | 457 | [지원현황](https://ratio.uwayapply.com/Sl5KOHxXJUpmJSY6Jko3ZlRm) | [모집요강](https://admission.inha.ac.kr/ajaxfile/CMN_SVC/FileView.do?GBN=X12&SITE_NO=2&MENU_NO=80&CONTENTS_NO=1&TYPE_CODE=C0601) |
| 연세대학교 미래캠퍼스 | 7 | 7 | 182 | [지원현황](https://ratio.uwayapply.com/Sl5KZiVgJldhYkpmJSY6Jko3ZlRm) | [모집요강](https://admission.yonsei.ac.kr/mirae/upload/guide/202609091128343AZAWL.PDF) |
| 아주대학교 | 18 | 17 | 182 | [지원현황](https://addon.jinhakapply.com/RatioV1/RatioH/Ratio11040711.html) | [모집요강](https://www.iajou.ac.kr/upload_data/mojib/20260825111418_62.pdf) |
| 한국항공대학교 | 8 | 8 | 198 | [지원현황](https://addon.jinhakapply.com/RatioV1/RatioH/Ratio11540991.html) | [모집요강](https://ibhak.kau.ac.kr/upload/GUIDES/20260813105041001.pdf) |

수집은 10분마다 실행하지만 원문 발표 시각이 더 최신일 때만 반영한다. 중앙대(10·17시), 인하대(10·14·17시), 연세대 미래(매시간), 아주대(10·13·17시) 등 서로 다른 공식 발표 주기를 학교 상세에 표시한다. 접수 마지막 날의 별도 발표 시각도 학교별로 기록했다. 같은 기준 시각에 수치가 바뀌면 검토 대상으로 보존하며 기존 검증 자료를 유지한다.

## 과거 자료와 충원 값

지원인원은 공식 최종 지원현황의 실제 수치를 사용한다. 충원율이나 반올림된 경쟁률에서 인원을 역산하지 않았다. 한국항공대·아주대의 충원 값은 실제 인원, 인하대·한신대·강남대는 최종 예비번호, 중앙대는 충원율이다. 연세대 미래의 충원 공지는 본문 주석에서 예비번호임을 명시한다. 2024년 연세대 미래는 4차 충원 기준임을 표시했다. 공개값이 비어 있으면 0으로 바꾸지 않는다.

| 대학 | 학년도 | 모집단위 | 모집 합계 | 지원 합계 | 경쟁률 자료 | 충원 자료 |
|---|---:|---:|---:|---:|---|---|
| 강남대 | 2026 | 16 | 359 | 3061 | [원문](https://ratio.uwayapply.com/Sl5KTThXclc4OUpmJSY6JkotZlRm) | [원문](https://admission.kangnam.ac.kr/iphak/stats.htm?s_year=2026&s_ctg_cd=susi&gubun=score) |
| 강남대 | 2025 | 0 | 0 | 0 | [원문](https://admission.kangnam.ac.kr/bbs/fileview.php?bbsid=paper&file_seq=3924) | 미운영 |
| 강남대 | 2024 | 0 | 0 | 0 | [원문](https://admission.kangnam.ac.kr/bbs/fileview.php?bbsid=paper&file_seq=3924) | 미운영 |
| 중앙대 다빈치 | 2026 | 7 | 48 | 512 | [원문](https://ratio.uwayapply.com/Sl5KOjhMSmYlJjomSi1mVGY=) | [원문](https://admission.cau.ac.kr/file/pdfDown.pdf?sfn=20260609012656201_afbb4d3d94014e6f8af1436a3d704faf.pdf&ofn=becaus_news_s_2027.pdf) |
| 중앙대 다빈치 | 2025 | 7 | 48 | 549 | [원문](https://ratio.uwayapply.com/Sl5KOjhMSmYlJjomSiNmVGY=) | [원문](https://admission.cau.ac.kr/files/2026/2026_ss_bn.pdf) |
| 중앙대 다빈치 | 2024 | 7 | 52 | 672 | [원문](https://ratio.uwayapply.com/Sl5KOjhMSmYlJjomSnpmVGY=) | [원문](https://admission.cau.ac.kr/file/pdfDown.pdf?sfn=20240712035037296_269778d174a1498e9533dd66b21becd2.pdf&ofn=2025_ss_bn.pdf) |
| 한신대 | 2026 | 24 | 261 | 1537 | [원문](https://ent.hs.ac.kr/_common/new_download_file.asp?menu=boardfile&file_no=893) | 경쟁률 자료에 포함 |
| 한신대 | 2025 | 21 | 265 | 1198 | [원문](https://addon.jinhakapply.com/RatioV1/RatioH/Ratio11630331.html) | [원문](https://ent.hs.ac.kr/_common/new_download_file.asp?menu=boardfile&file_no=812) |
| 한신대 | 2024 | 13 | 168 | 833 | [원문](https://addon.jinhakapply.com/RatioV1/RatioH/Ratio11630281.html) | [원문](https://ent.hs.ac.kr/_common/new_download_file.asp?menu=boardfile&file_no=721) |
| 인하대 | 2026 | 47 | 457 | 13361 | [원문](https://ratio.uwayapply.com/Sl5KOHxXJUpmJSY6JkotZlRm) | [원문](https://admission.inha.ac.kr/ajaxfile/FR_SVC/FileDown.do?GBN=X01&BOARD_SEQ=1&SITE_NO=2&BBS_SEQ=1301&FILE_SEQ=3) |
| 인하대 | 2025 | 48 | 458 | 16923 | [원문](https://ratio.uwayapply.com/Sl5KOHxXJUpmJSY6JkojZlRm) | 확인된 공개값 없음 |
| 인하대 | 2024 | 49 | 459 | 20345 | [원문](https://ratio.uwayapply.com/Sl5KOHxXJUpmJSY6Jko6ZlRm) | 확인된 공개값 없음 |
| 연세대 미래 | 2026 | 15 | 240 | 3424 | [원문](https://ratio.uwayapply.com/Sl5KZiVgJldhYkpmJSY6JkotZlRm) | 확인된 공개값 없음 |
| 연세대 미래 | 2025 | 15 | 227 | 3599 | [원문](https://ratio.uwayapply.com/Sl5KZiVgJldhYkpmJSY6JkojZlRm) | [원문](https://admission.yonsei.ac.kr/mirae/admission/html/rolling/noticeView.asp?BBS_NO=3115) |
| 연세대 미래 | 2024 | 15 | 251 | 6028 | [원문](https://ratio.uwayapply.com/Sl5KZiVgJldhYkpmJSY6Jko6ZlRm) | [원문](https://admission.yonsei.ac.kr/mirae/admission/html/rolling/noticeView.asp?BBS_NO=3115) |
| 아주대 | 2026 | 16 | 173 | 14111 | [원문](https://addon.jinhakapply.com/RatioV1/RatioH/Ratio11040601.html) | [원문](https://www.iajou.ac.kr/upload_data/mojib/20260819131018_44.pdf) |
| 아주대 | 2025 | 16 | 178 | 16357 | [원문](https://addon.jinhakapply.com/RatioV1/RatioH/Ratio11040491.html) | [원문](https://www.iajou.ac.kr/upload_data/mojib/20260819131018_44.pdf) |
| 아주대 | 2024 | 14 | 158 | 13667 | [원문](https://addon.jinhakapply.com/RatioV1/RatioH/Ratio11040371.html) | [원문](https://www.iajou.ac.kr/upload_data/mojib/20260819131018_44.pdf) |
| 한국항공대 | 2026 | 10 | 198 | 6098 | [원문](https://ibhak.kau.ac.kr/common/downLoadProc.asp?strFileName=2026%C7%D0%B3%E2%B5%B5%20%BC%F6%BD%C3%B8%F0%C1%FD%20%C0%D4%BD%C3%B0%E1%B0%FA%20(%C8%A8%C6%E4%C0%CC%C1%F6%20%B0%F8%C1%F6)&strRealFileName=20260424094844001&strPath1=BBS0007&strPath2=&strExt=pdf) | 경쟁률 자료에 포함 |
| 한국항공대 | 2025 | 10 | 195 | 5532 | [원문](https://ibhak.kau.ac.kr/common/downLoadProc.asp?strFileName=2025%C7%D0%B3%E2%B5%B5%20%BC%F6%BD%C3%B8%F0%C1%FD%20%C0%D4%BD%C3%B0%E1%B0%FA(%C8%A8%C6%E4%C0%CC%C1%F6%20%B0%F8%C1%F6%BF%EB)&strRealFileName=20250325162108001&strPath1=BBS0007&strPath2=&strExt=pdf) | 경쟁률 자료에 포함 |
| 한국항공대 | 2024 | 14 | 201 | 5075 | [원문](https://ibhak.kau.ac.kr/common/downLoadProc.asp?strFileName=2024%C7%D0%B3%E2%B5%B5%20%BC%F6%BD%C3%B8%F0%C1%FD%20%C0%D4%BD%C3%B0%E1%B0%FA(%C8%A8%C6%E4%C0%CC%C1%F6%20%B0%F8%C1%F6%BF%EB)&strRealFileName=20240408152815001&strPath1=BBS0007&strPath2=&strExt=pdf) | 경쟁률 자료에 포함 |

강남대 논술은 2026학년도 신설로 2024·2025년에는 운영되지 않았다. 인하대 2024·2025 및 연세대 미래 2026의 학과별 충원 값은 이번 조사에서 확인한 자료에 없어 미확인으로 유지했다.

## 모집단위 개편과 분류

- 중앙대 다빈치의 생명공학 전공은 응용 생명공학 분야로 공학에 포함하며 식품영양학은 제외한다. [생명자원공학부 소개](https://www.cau.ac.kr/cms/FR_CON/index.do?MENU_ID=1020), [시스템생명공학과 소개](https://cobiotech.cau.ac.kr/system/bm/bm-1.php).
- 한신대 금융공학·빅데이터융합학은 각각 수리금융학·응용통계학에서 명칭이 바뀐 수학·통계 분야다. [공식 개편 안내](https://ent.hs.ac.kr/ipsi/pages/?p=43&b=b_1_8&bn=21210&m=read). 경영학은 과거 3개 전공을 통합했으므로 이전 경영학 한 전공을 현재 전체로 연결하지 않는다. 2025 예비순위는 통합 공개값이라는 설명을 유지한다.
- 연세대 미래의 2024~2026 미래인재·창의인재 전형을 서로 구분한다. 자율융합계열은 2027 인문·자연 모집과 일대일 대응하지 않아 현재 학과 그래프에 연결하지 않는다. 당시 전형별 결과는 학교의 과거 표에서 볼 수 있다.
- 아주대 AI컴퓨터공학부와 이전 소프트웨어학과, 경제정치사회융합학부와 2024 정치외교학과·사회학과를 임의로 합산하지 않는다. 미래모빌리티공학과의 2024 AI모빌리티공학과는 대학 3개년 결과책의 대응에 따라 연결한다.
- 한국항공대 2027 공과대학·AI융합대학에는 과거 별도 모집한 스마트드론·AI자율주행이 통합되었다. 동일 이름의 대학이라도 범위가 달라졌다는 설명을 표시한다. 자유전공의 공학·이학·사회적성은 시험 유형이며 입학 후 전공 선택 범위는 같다. 이학적성을 자연과학으로 잘못 제외하지 않는다.
- 인하대 생명과학과는 제외하고 생명공학과는 공학으로 표시한다. 화공에너지 및 경영학부의 전공 표기 변경은 공식 모집요강을 근거로 대응했다.

## 확인

실제 13개 원문 수집, 학년도·학교명·시간·표 합계, 중앙대 서울 행 손상 시 전체 응답 거부, 기존 6개 데이터 회귀, 과거 합계 및 계열 분류를 테스트한다. 데스크톱과 390px 모바일에서 학교 이동·상세 그래프·자연과학 제외를 확인한다. 게시 관련 테스트의 Git 원격은 임시 로컬 저장소이며 GitHub 원격을 변경하지 않는다.

## 지역 표시

학교 카드·학교 상세·모집단위 표·학과 상세에 소재지를 표시하고 지역명 검색을 지원한다. 수원대는 경기 화성, 강남대는 경기 용인, 중앙대 다빈치는 경기 안성이다. 경기대는 원문의 캠퍼스 열에 따라 경기 수원/서울 서대문을 구분한다. 가천대는 2027 모집요강 p.31의 Ⓜ 표시에 따라 간호·치위생·응급구조·물리치료·방사선·의예·약학·바이오로직스의 인천 소재지를 구분하며 의공학·운동재활은 경기 성남으로 표시한다. 지역 출처는 `data/catalog.json`의 학교별 `location.sourceUrl`에 기록했다. 경쟁률 수집 시 지역 정보가 덮어써지지 않도록 검증 카탈로그에서 관리한다.
