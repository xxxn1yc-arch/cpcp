const gongGrid = document.getElementById('gong-grid');
const suGrid = document.getElementById('su-grid');
const downloadBtn = document.getElementById('download-btn');
const canvas = document.getElementById('merge-canvas');
const ctx = canvas.getContext('2d');

// 업로드된 이미지 객체들을 저장할 배열 (각 12개씩)
const gongImages = Array(12).fill(null);
const suImages = Array(12).fill(null);

// 1. 웹 화면에 12개씩 빈 칸 생성
function createGrid(gridElement, imageArray) {
    for (let i = 0; i < 12; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.index = i;

        cell.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            
            fileInput.onchange = (e) => {
                const file = e.target.value ? e.target.files[0] : null;
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        imageArray[i] = img; // 배열에 이미지 객체 저장
                        cell.style.backgroundImage = `url(${event.target.result})`;
                        cell.classList.add('has-img');
                    };
                };
                reader.readAsDataURL(file);
            };
            fileInput.click();
        });
        gridElement.appendChild(cell);
    }
}

createGrid(gongGrid, gongImages);
createGrid(suGrid, suImages);

// 2. 이미지 합성 및 다운로드 함수
downloadBtn.addEventListener('click', () => {
    const templateImg = new Image();
    templateImg.src = 'template.png'; // 새 템플릿 이미지 경로 (파일명 확인 필수!)

    templateImg.onload = () => {
        // 캔버스 크기를 원본 템플릿 크기와 일치시킴
        canvas.width = templateImg.width;
        canvas.height = templateImg.height;

        // 배경 템플릿 먼저 그리기
        ctx.drawImage(templateImg, 0, 0);

        // 💡 [좌표 튜닝] 새 이미지의 실제 흰색 칸 위치에 맞게 조절이 필요합니다.
        // 아래 수치들은 픽셀 기준 예시값입니다.
        const cellWidth = 100;  // 템플릿 안의 흰색 칸 가로 크기 (px)
        const cellHeight = 100; // 템플릿 안의 흰색 칸 세로 크기 (px)
        const gap = 6;          // 칸 사이의 검은 선 두께 (px)

        const gongGridX = 40;   // '공' 그리드가 시작되는 첫 번째 칸의 X 좌표
        const suGridX = 510;    // '수' 그리드가 시작되는 첫 번째 칸의 X 좌표
        const gridY = 260;      // 두 그리드가 시작되는 공통 Y 좌표 (상단 검은색 타이틀 아래)

        // '공' 이미지들 그리기
        drawCells(gongImages, gongGridX, gridY, cellWidth, cellHeight, gap);
        // '수' 이미지들 그리기
        drawCells(suImages, suGridX, gridY, cellWidth, cellHeight, gap);

        // 다운로드 링크 생성
        const link = document.createElement('a');
        link.download = 'gong_su_analysis.png'; // 저장될 파일명
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
});

function drawCells(images, startX, startY, w, h, gap) {
    for (let i = 0; i < 12; i++) {
        if (images[i]) {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const x = startX + col * (w + gap);
            const y = startY + row * (h + gap);
            
            // 칸 크기에 맞게 꽉 차게 이미지 그리기
            ctx.drawImage(images[i], x, y, w, h);
        }
    }
}
