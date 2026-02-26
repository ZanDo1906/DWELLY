import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface BlogContent {
  Loai: 'text' | 'image';
  Noi_dung?: string;
  Url?: string;
  Mo_ta?: string;
}

interface Blog {
  Ma_bai_viet: string;
  Tieu_de: string;
  Tom_tat: string;
  Noi_dung: BlogContent[];
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
  blog: Blog | null = null;
  relatedBlogs: Blog[] = [];
  allBlogs: Blog[] = [];
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBlogs();
    
    // Subscribe to route params to reload blog when navigating between blog posts
    this.route.paramMap.subscribe(params => {
      const blogId = params.get('id');
      if (blogId && this.allBlogs.length > 0) {
        this.updateBlogContent(blogId);
        window.scrollTo(0, 0);
      }
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

  private loadBlogs(): void {
    this.http.get<Blog[]>('assets/data/blog.json').subscribe({
      next: (blogs) => {
        this.allBlogs = blogs.filter((b) => b.Trang_thai === true);

        const blogId = this.route.snapshot.paramMap.get('id');
        if (blogId) {
          this.updateBlogContent(blogId);
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      },
    });
  }

  private updateBlogContent(blogId: string): void {
    const foundBlog = this.allBlogs.find((b) => b.Ma_bai_viet === blogId);
    if (foundBlog) {
      this.blog = foundBlog;
      this.loadRelatedBlogs();
    } else {
      this.router.navigate(['/']);
    }
  }

  private loadRelatedBlogs(): void {
    if (!this.blog) return;
    this.relatedBlogs = this.allBlogs.filter((b) => b.Ma_bai_viet !== this.blog?.Ma_bai_viet).slice(0, 3);
  }

  navigateToBlogDetail(blogId: string): void {
    this.router.navigate(['/blog-detail', blogId]);
  }
}
