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

// 1. 그리드 셀 생성 및 클릭 시 크롭 연동 (모바일 터치 및 클릭 차단 버그 해결)
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
                const file = e.target.files ? e.target.files[0] : null;
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (event) => {
                    currentTarget.array = imageArray;
                    currentTarget.index = i;
                    currentTarget.cellElement = cell;

                    // 💡 [해결 포인트] 크롭 라이브러리가 꼬이지 않도록 기존 인스턴스를 완전히 파괴 후 초기화
                    if (cropper) {
                        cropper.destroy();
                        cropper = null;
                    }

                    cropperImage.src = event.target.result;
                    modal.style.display = 'flex';

                    // 이미지 로드가 완전히 끝난 시점에 Cropper를 실행해야 모바일에서 튕기지 않습니다.
                    cropperImage.onload = () => {
                        if (cropper) return; // 중복 생성 방지
                        cropper = new Cropper(cropperImage, {
                            aspectRatio: 1, 
                            viewMode: 1,
                            dragMode: 'move',
                            background: false,
                            autoCropArea: 0.9,
                            cropBoxMovable: false,
                            cropBoxResizable: false,
                            toggleDragModeOnDblclick: false,
                            responsive: true,
                            restore: false
                        });
                    };
                };
                reader.readAsDataURL(file);
            };
            
            // 모바일 사파리 보안 우회를 위해 이벤트를 즉시 실행합니다.
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
    if (cropper) {
        cropper.destroy();
        cropper = null;
    }
});

// 크롭 완료 처리
cropConfirmBtn.addEventListener('click', () => {
    if (!cropper) return;
    
    // 1020 해상도에 최적화된 고화질 크기(300px)로 추출
    const croppedCanvas = cropper.getCroppedCanvas({
        width: 300,
        height: 300,
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'medium'
    });
    
    if (!croppedCanvas) return;

    const img = new Image();
    img.src = croppedCanvas.toDataURL('image/png');
    img.onload = () => {
        currentTarget.array[currentTarget.index] = img;
        currentTarget.cellElement.style.backgroundImage = `url(${img.src})`;
        currentTarget.cellElement.classList.add('has-img');
        modal.style.display = 'none';
        
        cropper.destroy();
        cropper = null;
    };
});

// 2. 최종 공/수 합성 및 다운로드 (1020x850 해상도 정밀 매핑)
downloadBtn.addEventListener('click', () => {
    const templateImg = new Image();
    templateImg.src = 'template.png'; 

    templateImg.onload = () => {
        canvas.width = 1020;
        canvas.height = 850;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(templateImg, 0, 0, 1020, 850);

        // 🎯 1020x850 해상도 실측 수치
        const cellWidth = 139;   
        const cellHeight = 139;  
        
        const gapX = 7;          
        const gapY = 7;          

        const gongStartX = 39;   
        const suStartX = 546;    
        const gridY = 135;       

        drawCells(gongImages, gongStartX, gridY, cellWidth, cellHeight, gapX, gapY);
        drawCells(suImages, suStartX, gridY, cellWidth, cellHeight, gapX, gapY);

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
            ctx.drawImage(images[i], x, y, w, h);
        }
    }
}
