const gongGrid = document.getElementById('gong-grid');
const suGrid = document.getElementById('su-grid');
const downloadBtn = document.getElementById('download-btn');
const canvas = document.getElementById('merge-canvas');
const ctx = canvas.getContext('2d');

const modal = document.getElementById('cropper-modal');
const cropperImage = document.getElementById('cropper-image');
const cropCancelBtn = document.getElementById('crop-cancel-btn');
const cropConfirmBtn = document.getElementById('crop-confirm-btn');

let cropper = null;
let currentTarget = { array: null, index: null, cellElement: null };

const gongImages = Array(12).fill(null);
const suImages = Array(12).fill(null);

// 1. 그리드 셀 생성 및 클릭 시 풀스크린 크롭 연동
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
                    currentTarget.array = imageArray;
                    currentTarget.index = i;
                    currentTarget.cellElement = cell;

                    cropperImage.src = event.target.result;
                    modal.style.display = 'flex';

                    if (cropper) cropper.destroy();
                    cropper = new Cropper(cropperImage, {
                        aspectRatio: 1, // 1:1 정사각형 고정
                        viewMode: 1,
                        dragMode: 'move',
                        background: false,
                        autoCropArea: 1,
                        cropBoxMovable: false,
                        cropBoxResizable: false,
                        toggleDragModeOnDblclick: false,
                    });
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

// 크롭 취소 처리
cropCancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    if (cropper) cropper.destroy();
});

// 크롭 완료 처리
cropConfirmBtn.addEventListener('click', () => {
    if (!cropper) return;
    
    // 💡 [해결 포인트 1] width, height 제한을 완전히 없애고 사용자가 크롭한 원본 화질 크기 그대로 추출합니다.
    const croppedCanvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
    });
    
    const img = new Image();
    img.src = croppedCanvas.toDataURL('image/png');
    img.onload = () => {
        currentTarget.array[currentTarget.index] = img;
        currentTarget.cellElement.style.backgroundImage = `url(${img.src})`;
        currentTarget.cellElement.classList.add('has-img');
        modal.style.display = 'none';
        cropper.destroy();
    };
});

// 2. 최종 공/수 합성 및 다운로드 (3060x2550 해상도 정밀 매핑)
downloadBtn.addEventListener('click', () => {
    const templateImg = new Image();
    templateImg.src = 'template.png'; 

    templateImg.onload = () => {
        // 💡 [해결 포인트 2] 캔버스 해상도가 모바일 디바이스 픽셀 밀도에 의해 왜곡되지 않도록 원본 크기로 강제 고정합니다.
        canvas.width = 3060;
        canvas.height = 2550;
        
        // 캔버스를 깨끗하게 비우고 템플릿 그리기
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(templateImg, 0, 0, 3060, 2550);

        // 🎯 [3060x2550 규격 완벽 실측 매핑 수치]
        const cellWidth = 416;   // 흰색 칸 하나 가로 크기
        const cellHeight = 416;  // 흰색 칸 하나 세로 크기
        
        const gapX = 21;          // 칸 사이 검은 세로선 두께
        const gapY = 21;          // 칸 사이 검은 가로선 두께

        const gongStartX = 117;   // '공' 그리드 첫 번째 칸 시작 X 좌표
        const suStartX = 1638;    // '수' 그리드 첫 번째 칸 시작 X 좌표
        const gridY = 404;        // 상단 검은 바 타이틀 아래 시작 Y 좌표

        // '공' 이미지들 그리기
        drawCells(gongImages, gongStartX, gridY, cellWidth, cellHeight, gapX, gapY);
        // '수' 이미지들 그리기
        drawCells(suImages, suStartX, gridY, cellWidth, cellHeight, gapX, gapY);

        // 최종 다운로드 처리
        const link = document.createElement('a');
        link.download = 'gong_su_analysis.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };
});

function drawCells(images, startX, startY, w, h, gapX, gapY) {
    for (let i = 0; i < 12; i++) {
        if (images[i]) {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const x = startX + col * (w + gapX);
            const y = startY + row * (h + gapY);
            
            // 저장 시 각 칸에 이미지가 꽉 차고 찌그러지지 않게 강제로 지정된 흰 칸 크기(w, h)로 맞춰 그립니다.
            ctx.drawImage(images[i], x, y, w, h);
        }
    }
}
