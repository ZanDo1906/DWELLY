import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TextBlock {
  Loai: 'text';
  Noi_dung: string;
}

interface ImageBlock {
  Loai: 'image';
  Url: string;
  Mo_ta: string;
}

type ContentBlock = TextBlock | ImageBlock;

@Component({
  selector: 'app-blog-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './blog.html',
  styleUrls: ['./blog.css']
})
export class Blog {

  maBaiViet = 'BV' + Date.now().toString().slice(-6);
  today = new Date().toLocaleDateString('vi-VN');
  tieuDe = '';
  tomTat = '';
  hinhAnh = '';
  trangThai = true;

  blocks: ContentBlock[] = [];

  // ADD
  addTextBlock() {
    this.blocks.push({
      Loai: 'text',
      Noi_dung: ''
    });
  }

  addImageBlock() {
    this.blocks.push({
      Loai: 'image',
      Url: '',
      Mo_ta: ''
    });
  }

  // REMOVE
  removeBlock(index: number) {
    this.blocks.splice(index, 1);
  }

  // MOVE
  moveBlock(index: number, direction: 'up' | 'down') {
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= this.blocks.length) return;

    const temp = this.blocks[index];
    this.blocks[index] = this.blocks[newIndex];
    this.blocks[newIndex] = temp;
  }

  // SUBMIT
  savePost() {
    const postData = {
      Ma_bai_viet: this.maBaiViet,
      Tieu_de: this.tieuDe,
      Tom_tat: this.tomTat,
      Noi_dung: this.blocks,
      Hinh_anh: this.hinhAnh,
      Trang_thai: this.trangThai,
      Ngay_tao: new Date().toISOString(),
      Ma_quan_tri_vien: 'ADM001'
    };

    console.log(postData);
    alert('Đã lưu bài viết! Check console.');
  }
}