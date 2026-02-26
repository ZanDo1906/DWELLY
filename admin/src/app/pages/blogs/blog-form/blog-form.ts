import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SanitizeHtmlPipe } from '../../../pipes/sanitize-html.pipe';

@Component({
  selector: 'app-blog-form',
  imports: [CommonModule, FormsModule, RouterLink, SanitizeHtmlPipe],
  templateUrl: './blog-form.html',
  styleUrl: './blog-form.css',
})
export class BlogForm implements OnInit {
  isEditMode = false;
  blogId: string | null = null;

  // Author info
  authorAvatar = 'https://via.placeholder.com/80';
  authorName = 'Quyen Nguyen';
  publishDate = '10/01/2026';
  status: 'published' | 'draft' | 'hidden' = 'published';

  // Blog info
  blogCode = 'B01';
  titleContent = 'this is dummy text. this is dummy text. this is dummy text. this is dummy text.';
  titleContentHtml = 'this is dummy text. this is dummy text. this is dummy text. this is dummy text.';
  contentText = 'this is dummy text. this is dummy text. this is dummy text. this is dummy text.';
  contentTextHtml = 'this is dummy text. this is dummy text. this is dummy text. this is dummy text.';
  lastEditedDate = 'xx 00, 0000 at 00:00 am';
  
  // Editor modes
  titleEditorMode: 'visual' | 'text' = 'visual';
  contentEditorMode: 'visual' | 'text' = 'visual';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // Check if we're in edit mode
    this.blogId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.blogId;

    if (this.isEditMode) {
      this.loadBlogData(this.blogId!);
    } else {
      // New blog - initialize with defaults
      this.initializeNewBlog();
    }

    // Update last edited date
    this.updateLastEditedDate();
    
    // Initialize preview
    this.updatePreview('title');
    this.updatePreview('content');
  }

  loadBlogData(id: string): void {
    // TODO: Load blog data from service
    console.log('Loading blog:', id);
  }

  initializeNewBlog(): void {
    this.authorName = 'Quyen Nguyen';
    this.publishDate = new Date().toLocaleDateString('vi-VN');
    this.status = 'draft';
    this.blogCode = 'B01'; // TODO: Generate new code
    this.titleContent = '';
    this.contentText = '';
  }

  getStatusLabel(status: string): string {
    const labels: {[key: string]: string} = {
      'published': 'Đã đăng',
      'draft': 'Nháp',
      'hidden': 'Đã ẩn'
    };
    return labels[status] || status;
  }

  getWordCount(text: string): number {
    if (!text) return 0;
    // Remove HTML tags for word count
    const plainText = text.replace(/<[^>]*>/g, ' ');
    return plainText.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  updateLastEditedDate(): void {
    const now = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[now.getMonth()];
    const day = now.getDate();
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'pm' : 'am';
    
    this.lastEditedDate = `${month} ${day}, ${year} at ${hours}:${minutes} ${ampm}`;
  }

  addMedia(field: string): void {
    console.log('Add media to:', field);
    // TODO: Implement media upload
  }

  quickInsert(tag: string, field: 'title' | 'content'): void {
    let insertion = '';
    
    switch(tag) {
      case 'p':
        insertion = `<p>Nhập nội dung đoạn văn...</p>`;
        break;
      case 'b':
        insertion = `<b>text đậm</b>`;
        break;
      case 'i':
        insertion = `<i>text nghiêng</i>`;
        break;
      case 'ul':
        insertion = `<ul>\n  <li>Mục 1</li>\n  <li>Mục 2</li>\n  <li>Mục 3</li>\n</ul>`;
        break;
      case 'ol':
        insertion = `<ol>\n  <li>Bước 1</li>\n  <li>Bước 2</li>\n  <li>Bước 3</li>\n</ol>`;
        break;
      default:
        insertion = `<${tag}>Nội dung</${tag}>`;
    }
    
    if (field === 'title') {
      this.titleContent += (this.titleContent ? ' ' : '') + insertion;
    } else {
      this.contentText += (this.contentText ? '\n\n' : '') + insertion;
    }
    
    this.updatePreview(field);
  }

  quickInsertImage(field: 'title' | 'content'): void {
    const url = prompt('Nhập địa chỉ URL của hình ảnh:\n\nVí dụ: https://example.com/image.jpg');
    if (url) {
      const imgTag = `<img src="${url}" alt="Hình ảnh blog" style="max-width: 100%; height: auto;">`;
      if (field === 'title') {
        this.titleContent += (this.titleContent ? '\n' : '') + imgTag;
      } else {
        this.contentText += (this.contentText ? '\n\n' : '') + imgTag;
      }
      this.updatePreview(field);
    }
  }

  quickInsertLink(field: 'title' | 'content'): void {
    const url = prompt('Nhập địa chỉ URL:\n\nVí dụ: https://example.com');
    if (url) {
      const text = prompt('Nhập text hiển thị cho link:') || 'Nhấp vào đây';
      const linkTag = `<a href="${url}" target="_blank">${text}</a>`;
      if (field === 'title') {
        this.titleContent += linkTag;
      } else {
        this.contentText += linkTag;
      }
      this.updatePreview(field);
    }
  }

  updatePreview(field: 'title' | 'content'): void {
    if (field === 'title') {
      this.titleContentHtml = this.titleContent;
    } else {
      this.contentTextHtml = this.contentText;
    }
    this.updateLastEditedDate();
  }

  toggleFullscreen(field: 'title' | 'content'): void {
    // TODO: Implement fullscreen toggle
    console.log('Toggle fullscreen for:', field);
  }

  saveBlog(): void {
    if (this.isEditMode) {
      // Update existing blog
      console.log('Updating blog:', this.blogId);
      // TODO: Call API to update
    } else {
      // Create new blog
      console.log('Creating new blog');
      // TODO: Call API to create
    }

    // Navigate back to blog list
    this.router.navigate(['/blogs']);
  }
}
