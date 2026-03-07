import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Blog as BlogService } from '../../../services/blog';
import { iBlog, iBlogContent } from '../../../interfaces/blog';

interface BlogViewModel {
  Ma_bai_viet: string;
  Tieu_de: string;
  Tom_tat: string;
  Noi_dung: iBlogContent[];
  Hinh_anh: string;
  Trang_thai: boolean;
  Ngay_tao: string;
  Ma_quan_tri_vien: string;
}

@Component({
  selector: 'app-blog-detail',
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-detail.html',
  styleUrl: './blog-detail.css',
})
export class BlogDetail implements OnInit, AfterViewInit {
  blog: BlogViewModel | null = null;
  relatedBlogs: BlogViewModel[] = [];
  allBlogs: BlogViewModel[] = [];
  isLoading = true;
  isCopied = false;

  constructor(
    private route: ActivatedRoute,
    private blogService: BlogService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const blogId = params.get('id');
      if (!blogId) {
        this.router.navigate(['/']);
        return;
      }

      this.loadBlogPage(blogId);
      window.scrollTo(0, 0);
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const newsSection = document.querySelector('.news-section');
      if (newsSection) {
        newsSection.classList.add('animate-in');
      }
    }, 100);
  }

  private loadBlogPage(blogId: string): void {
    this.isLoading = true;

    forkJoin({
      detail: this.blogService.getBlogById(blogId),
      all: this.blogService.getBlogData(),
    }).subscribe({
      next: ({ detail, all }) => {
        this.blog = this.normalizeBlog(detail);
        this.allBlogs = all
          .filter((b) => b.Trang_thai === true)
          .map((b) => this.normalizeBlog(b));
        this.loadRelatedBlogs();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.router.navigate(['/']);
      },
    });
  }

  private normalizeBlog(blog: iBlog): BlogViewModel {
    return {
      ...blog,
      Ngay_tao: String(blog.Ngay_tao),
      Noi_dung: this.normalizeContent(blog.Noi_dung),
    };
  }

  private normalizeContent(content: iBlog['Noi_dung']): iBlogContent[] {
    if (Array.isArray(content)) {
      return content;
    }

    if (typeof content === 'string') {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          return parsed as iBlogContent[];
        }
      } catch {
        // Keep fallback below for plain text DB values.
      }

      return [{ Loai: 'text', Noi_dung: content }];
    }

    return [];
  }

  private loadRelatedBlogs(): void {
    if (!this.blog) return;
    this.relatedBlogs = this.allBlogs.filter((b) => b.Ma_bai_viet !== this.blog?.Ma_bai_viet).slice(0, 3);
  }

  navigateToBlogDetail(blogId: string): void {
    this.router.navigate(['/blog-detail', blogId]);
  }

  copyBlogLink(): void {
    const currentUrl = window.location.href;

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(currentUrl).then(() => {
        this.showCopiedState();
      }).catch(() => {
        this.copyWithFallback(currentUrl);
      });
      return;
    }

    this.copyWithFallback(currentUrl);
  }

  private copyWithFallback(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      this.showCopiedState();
    } catch {
      alert('Không thể copy link tự động. Bạn vui lòng copy thủ công trên thanh địa chỉ.');
    } finally {
      document.body.removeChild(textArea);
    }
  }

  private showCopiedState(): void {
    this.isCopied = true;
    setTimeout(() => {
      this.isCopied = false;
    }, 1500);
  }
}
