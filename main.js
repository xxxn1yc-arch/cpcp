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

// 크롭 취소 및 완료 처리
cropCancelBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    if (cropper) cropper.destroy();
});

cropConfirmBtn.addEventListener('click', () => {
    if (!cropper) return;
    // 💡 원본 이미지가 크기 때문에 크롭 추출물도 800px 고화질로 키워서 선명도를 유지합니다.
    const croppedCanvas = cropper.getCroppedCanvas({ width: 800, height: 800 });
    
    const img = new Image();
    img.src = croppedCanvas.toDataURL();
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
        canvas.width = templateImg.width;
        canvas.height
