// script.js - Simple static site functionality
// All data comes from metadata.js

class AcademicHub {
    constructor() {
        this.metadata = window.metadata || {};
        this.focusedSection = null;
        this.searchTimeout = null;
        this.currentVideo = null;
        this.init();
    }

    init() {
        // Set current year in footer
        document.getElementById('currentYear').textContent = new Date().getFullYear();
        
        // Load all content
        this.loadContent();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Initialize navigation
        this.initNavigation();
        
        // Check for video ID in URL
        this.checkVideoFromUrl();
    }

    loadContent() {
        // Update site info from metadata
        this.updateSiteInfo();
        
        // Render all content
        this.renderAllContent();
        
        // Update statistics
        this.updateStats();
    }

    updateSiteInfo() {
        const siteInfo = this.metadata.siteInfo || {};
        
        // Update page title
        document.title = siteInfo.title || "Academic Resource Hub";
        
        // Update header and footer
        const elements = [
            'siteTitle',
            'siteDescription',
            'footerSiteTitle',
            'footerSiteDescription',
            'copyrightName',
            'heroTitle'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (id.includes('Description')) {
                    element.textContent = siteInfo.description || "";
                } else if (id.includes('Title')) {
                    element.textContent = siteInfo.title || "Academic Resource Hub";
                }
            }
        });
        
        // Update external links
        const youtubeLink = document.getElementById('youtubeLink');
        if (siteInfo.youtubeChannel && youtubeLink) {
            youtubeLink.href = `https://youtube.com/channel/${siteInfo.youtubeChannel}`;
        }
        
        const emailLink = document.getElementById('emailLink');
        if (siteInfo.contactEmail && emailLink) {
            emailLink.href = `mailto:${siteInfo.contactEmail}`;
        }
    }

    renderAllContent() {
        this.renderVideos();
        this.renderNotes();
        this.renderPapers();
        this.renderPlans();
        this.renderSchemes();
        this.hideExcessResources();
    }

    renderVideos() {
        const container = document.getElementById('videosGrid');
        const videos = this.metadata.videos || [];
        
        if (videos.length === 0) {
            container.innerHTML = '<div class="no-resources"><i class="fas fa-video-slash"></i><p>No video lessons available</p></div>';
            return;
        }
        
        container.innerHTML = videos.map(video => {
            // Use multiple thumbnail fallbacks
            const thumbnailUrls = [
                `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`,
                `https://img.youtube.com/vi/${video.id}/sddefault.jpg`,
                `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`,
                `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`,
                `https://img.youtube.com/vi/${video.id}/default.jpg`
            ];
            
            const fallbackSVG = this.getFallbackImage(video.subject || 'Video Lesson');
            
            return `
                <div class="video-card" data-video-id="${video.id}" onclick="academicHub.playVideoInline('${video.id}', '${this.escapeHtml(video.title)}', '${this.escapeHtml(video.description)}', '${video.subject || 'General'}')">
                    <div class="video-thumbnail">
                        <img src="${thumbnailUrls[2]}" 
                             alt="${this.escapeHtml(video.title)}"
                             loading="lazy"
                             onerror="this.onerror=null; this.src='${thumbnailUrls[3]}';">
                        <span class="video-duration">${video.duration || 'N/A'}</span>
                    </div>
                    <div class="video-content">
                        <h3 class="video-title">${this.escapeHtml(video.title)}</h3>
                        <p class="video-description">${this.escapeHtml(video.description)}</p>
                        <div class="video-meta">
                            <span><i class="fas fa-book"></i> ${video.subject || 'General'}</span>
                            <span><i class="fas fa-play-circle"></i> Play</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    getFallbackImage(text) {
        // Create a simple fallback image SVG
        const svg = `<svg width="320" height="180" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#2563eb"/>
            <text x="50%" y="50%" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dy=".3em">${text}</text>
        </svg>`;
        return btoa(svg);
    }

    playVideoInline(videoId, title, description, subject) {
        this.currentVideo = { videoId, title, description };
        
        // Hide video grid
        const videosGrid = document.getElementById('videosGrid');
        if (videosGrid) videosGrid.style.display = 'none';
        
        // Create video player section
        const videosSection = document.getElementById('videos');
        if (!videosSection) return;
        
        let playerSection = videosSection.querySelector('.video-player-section');
        
        if (!playerSection) {
            playerSection = document.createElement('div');
            playerSection.className = 'video-player-section';
            videosSection.appendChild(playerSection);
        }
        
        // Set player HTML with better YouTube embed
        playerSection.innerHTML = `
            <div class="container">
                <div class="video-player-container youtube-player">
                    <iframe id="inlineVideoPlayer" 
                            width="100%" 
                            height="100%" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen
                            title="${this.escapeHtml(title)}">
                    </iframe>
                </div>
                <div class="video-player-info">
                    <h2 class="video-player-title">${title}</h2>
                    <p class="video-player-description">${description}</p>
                    <div class="video-player-actions">
                        <button class="back-to-videos" onclick="academicHub.backToVideos()">
                            <i class="fas fa-arrow-left"></i> Back to Videos
                        </button>
                        <a href="https://www.youtube.com/watch?v=${videoId}" 
                           class="btn btn-outline" 
                           target="_blank" 
                           rel="noopener noreferrer">
                            <i class="fab fa-youtube"></i> Watch on YouTube
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        // Load YouTube iframe with simpler embed to avoid errors
        const player = playerSection.querySelector('#inlineVideoPlayer');
        
        // Use simple embed URL - many videos don't allow embedding
        // So we'll show a message and link to YouTube directly
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        
        // Try to load the embed
        player.src = embedUrl;
        
        // Check if embed loads successfully
        player.onload = () => {
            console.log('YouTube embed loaded successfully');
        };
        
        player.onerror = () => {
            console.log('YouTube embed failed, showing fallback');
            playerSection.innerHTML = `
                <div class="container">
                    <div class="video-player-container youtube-player" style="background: #000;">
                        <div style="color: white; text-align: center; padding: 60px 20px;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 48px; color: #f59e0b; margin-bottom: 20px;"></i>
                            <h3 style="margin-bottom: 10px;">Video Cannot Be Embedded</h3>
                            <p style="margin-bottom: 20px; color: #ccc;">This video does not allow embedding. Please watch it on YouTube.</p>
                            <a href="https://www.youtube.com/watch?v=${videoId}" 
                               class="btn btn-primary" 
                               target="_blank" 
                               rel="noopener noreferrer"
                               style="background: #ff0000; border-color: #ff0000;">
                                <i class="fab fa-youtube"></i> Watch on YouTube
                            </a>
                        </div>
                    </div>
                    <div class="video-player-info">
                        <h2 class="video-player-title">${title}</h2>
                        <p class="video-player-description">${description}</p>
                        <div class="video-player-actions">
                            <button class="back-to-videos" onclick="academicHub.backToVideos()">
                                <i class="fas fa-arrow-left"></i> Back to Videos
                            </button>
                        </div>
                    </div>
                </div>
            `;
        };
        
        // Show player section
        playerSection.classList.add('active');
        
        // Update URL without page reload
        history.pushState({ videoId }, title, `?video=${videoId}`);
        
        // Scroll to video section
        videosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    backToVideos() {
        const playerSection = document.querySelector('.video-player-section');
        const videosGrid = document.getElementById('videosGrid');
        
        if (playerSection) {
            // Stop video if iframe exists
            const player = playerSection.querySelector('#inlineVideoPlayer');
            if (player) {
                try {
                    player.src = '';
                } catch (e) {
                    console.log('Error clearing iframe src:', e);
                }
            }
            
            // Hide player
            playerSection.classList.remove('active');
            
            // Remove player after animation
            setTimeout(() => {
                if (playerSection && playerSection.parentNode) {
                    playerSection.remove();
                }
            }, 300);
        }
        
        // Show videos grid
        if (videosGrid) {
            videosGrid.style.display = 'grid';
        }
        
        // Clear URL state
        if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        this.currentVideo = null;
    }

    checkVideoFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const videoId = urlParams.get('video');
        
        if (videoId) {
            // Find video in metadata
            const videos = this.metadata.videos || [];
            const video = videos.find(v => v.id === videoId);
            
            if (video) {
                // Wait a bit for DOM to be ready
                setTimeout(() => {
                    this.playVideoInline(video.id, video.title, video.description, video.subject);
                }, 500);
            }
        }
    }

    renderNotes() {
        const container = document.getElementById('notesGrid');
        const notes = this.metadata.notes || [];
        
        if (notes.length === 0) {
            container.innerHTML = '<div class="no-resources"><i class="fas fa-file-slash"></i><p>No study notes available</p></div>';
            return;
        }
        
        container.innerHTML = notes.map(note => `
            <div class="resource-card">
                <div class="card-header notes-bg">
                    <i class="fas fa-file-pdf"></i>
                    <h3>${this.escapeHtml(note.title)}</h3>
                </div>
                <div class="card-content">
                    <p>${this.escapeHtml(note.description)}</p>
                    
                    <div class="resource-details">
                        <div class="detail-item">
                            <i class="fas fa-file"></i>
                            <span>${note.pages || '?'} pages</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-book"></i>
                            <span>${note.subject || 'General'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-weight-hanging"></i>
                            <span>${note.fileSize || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-calendar"></i>
                            <span>${note.lastUpdated || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="card-meta">
                        <span><i class="fas fa-graduation-cap"></i> ${note.grade || 'All Levels'}</span>
                    </div>
                    
                    <div class="pdf-actions">
                        <a href="https://drive.google.com/uc?export=download&id=${note.driveId}" 
                           class="btn btn-sm btn-success" 
                           download="${this.escapeHtml(note.title.replace(/[^a-z0-9]/gi, '_'))}.pdf">
                            <i class="fas fa-download"></i> Download
                        </a>
                        <a href="https://drive.google.com/file/d/${note.driveId}/preview" 
                           class="btn btn-sm btn-outline" 
                           target="_blank" 
                           rel="noopener noreferrer">
                            <i class="fas fa-eye"></i> View
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPapers() {
        const container = document.getElementById('papersGrid');
        const papers = this.metadata.pastPapers || [];
        
        if (papers.length === 0) {
            container.innerHTML = '<div class="no-resources"><i class="fas fa-file-alt-slash"></i><p>No past papers available</p></div>';
            return;
        }
        
        container.innerHTML = papers.map(paper => `
            <div class="resource-card">
                <div class="card-header papers-bg">
                    <i class="fas fa-file-contract"></i>
                    <h3>${this.escapeHtml(paper.title)}</h3>
                </div>
                <div class="card-content">
                    <p>${this.escapeHtml(paper.description)}</p>
                    
                    <div class="resource-details">
                        <div class="detail-item">
                            <i class="fas fa-calendar"></i>
                            <span>${paper.year || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-book"></i>
                            <span>${paper.subject || 'All Subjects'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-weight-hanging"></i>
                            <span>${paper.fileSize || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-file"></i>
                            <span>${paper.pages || 'N/A'} pages</span>
                        </div>
                    </div>
                    
                    <div class="card-meta">
                        <span><i class="fas fa-graduation-cap"></i> ${paper.grade || 'All Levels'}</span>
                        <span><i class="fas fa-calendar-alt"></i> ${paper.lastUpdated || 'N/A'}</span>
                    </div>
                    
                    <div class="pdf-actions">
                        <a href="https://drive.google.com/uc?export=download&id=${paper.driveId}" 
                           class="btn btn-sm btn-success" 
                           download="${this.escapeHtml(paper.title.replace(/[^a-z0-9]/gi, '_'))}.pdf">
                            <i class="fas fa-download"></i> Download
                        </a>
                        <a href="https://drive.google.com/file/d/${paper.driveId}/preview" 
                           class="btn btn-sm btn-outline" 
                           target="_blank" 
                           rel="noopener noreferrer">
                            <i class="fas fa-eye"></i> View
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderPlans() {
        const container = document.getElementById('plansGrid');
        const plans = this.metadata.lessonPlans || [];
        
        if (plans.length === 0) {
            container.innerHTML = '<div class="no-resources"><i class="fas fa-calendar-times"></i><p>No lesson plans available</p></div>';
            return;
        }
        
        container.innerHTML = plans.map(plan => {
            const icon = plan.type === 'lesson-plan' ? 'fa-calendar-alt' : 'fa-book';
            const typeName = plan.type === 'lesson-plan' ? 'Lesson Plan' : 'Syllabus';
            
            return `
                <div class="resource-card">
                    <div class="card-header plans-bg">
                        <i class="fas ${icon}"></i>
                        <h3>${this.escapeHtml(plan.title)}</h3>
                    </div>
                    <div class="card-content">
                        <p>${this.escapeHtml(plan.description)}</p>
                        
                        <div class="resource-details">
                            <div class="detail-item">
                                <i class="fas ${icon}"></i>
                                <span>${typeName}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-book"></i>
                                <span>${plan.subject || 'All Subjects'}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-weight-hanging"></i>
                                <span>${plan.fileSize || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-file"></i>
                                <span>${plan.pages || 'N/A'} pages</span>
                            </div>
                        </div>
                        
                        <div class="card-meta">
                            <span><i class="fas fa-graduation-cap"></i> ${plan.grade || 'All Levels'}</span>
                            <span><i class="fas fa-clock"></i> ${plan.term || 'N/A'}</span>
                        </div>
                        
                        <div class="pdf-actions">
                            <a href="https://drive.google.com/uc?export=download&id=${plan.driveId}" 
                               class="btn btn-sm btn-success" 
                               download="${this.escapeHtml(plan.title.replace(/[^a-z0-9]/gi, '_'))}.pdf">
                                <i class="fas fa-download"></i> Download
                            </a>
                            <a href="https://drive.google.com/file/d/${plan.driveId}/preview" 
                               class="btn btn-sm btn-outline" 
                               target="_blank" 
                               rel="noopener noreferrer">
                                <i class="fas fa-eye"></i> View
                            </a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderSchemes() {
        const container = document.getElementById('schemesGrid');
        const schemes = this.metadata.schemesOfWork || [];
        
        if (schemes.length === 0) {
            container.innerHTML = '<div class="no-resources"><i class="fas fa-tasks"></i><p>No schemes of work available</p></div>';
            return;
        }
        
        container.innerHTML = schemes.map(scheme => `
            <div class="resource-card">
                <div class="card-header schemes-bg">
                    <i class="fas fa-tasks"></i>
                    <h3>${this.escapeHtml(scheme.title)}</h3>
                </div>
                <div class="card-content">
                    <p>${this.escapeHtml(scheme.description)}</p>
                    
                    <div class="resource-details">
                        <div class="detail-item">
                            <i class="fas fa-calendar"></i>
                            <span>${scheme.term || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-book"></i>
                            <span>${scheme.subject || 'General'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-weight-hanging"></i>
                            <span>${scheme.fileSize || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-file"></i>
                            <span>${scheme.pages || 'N/A'} pages</span>
                        </div>
                    </div>
                    
                    <div class="card-meta">
                        <span><i class="fas fa-graduation-cap"></i> ${scheme.grade || 'All Levels'}</span>
                        <span><i class="fas fa-calendar-alt"></i> ${scheme.lastUpdated || 'N/A'}</span>
                    </div>
                    
                    <div class="pdf-actions">
                        <a href="https://drive.google.com/uc?export=download&id=${scheme.driveId}" 
                           class="btn btn-sm btn-success" 
                           download="${this.escapeHtml(scheme.title.replace(/[^a-z0-9]/gi, '_'))}.pdf">
                            <i class="fas fa-download"></i> Download
                        </a>
                        <a href="https://drive.google.com/file/d/${scheme.driveId}/preview" 
                           class="btn btn-sm btn-outline" 
                           target="_blank" 
                           rel="noopener noreferrer">
                            <i class="fas fa-eye"></i> View
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    }

    hideExcessResources() {
        const sections = ['videos', 'notes', 'papers', 'plans', 'schemes'];
        
        sections.forEach(section => {
            const grid = document.getElementById(`${section}Grid`);
            if (!grid || grid.classList.contains('show-all') || grid.style.display === 'none') return;
            
            const cards = grid.querySelectorAll('.resource-card, .video-card');
            const limit = window.innerWidth < 768 ? 1 : 4;
            
            cards.forEach((card, index) => {
                card.style.display = index < limit ? 'block' : 'none';
            });
        });
    }

    toggleShowAll(section) {
        const grid = document.getElementById(`${section}Grid`);
        if (!grid || grid.style.display === 'none') return;
        
        const buttons = document.querySelectorAll(`[data-section="${section}"]`);
        
        if (grid.classList.contains('show-all')) {
            // Return to normal view
            grid.classList.remove('show-all');
            buttons.forEach(btn => {
                btn.innerHTML = '<i class="fas fa-expand"></i> Show All';
            });
            
            // Show all sections
            document.querySelectorAll('.resource-section').forEach(s => {
                s.style.display = 'block';
            });
            
            // Hide excess resources
            this.hideExcessResources();
            this.focusedSection = null;
        } else {
            // Enter focus mode
            grid.classList.add('show-all');
            buttons.forEach(btn => {
                btn.innerHTML = '<i class="fas fa-compress"></i> Show Less';
            });
            
            // Show all cards in this section
            const cards = grid.querySelectorAll('.resource-card, .video-card');
            cards.forEach(card => {
                card.style.display = 'block';
            });
            
            // Hide other sections
            document.querySelectorAll('.resource-section').forEach(s => {
                if (s.id !== section) {
                    s.style.display = 'none';
                }
            });
            
            this.focusedSection = section;
        }
        
        // Smooth scroll to section
        const sectionElement = document.getElementById(section);
        if (sectionElement) {
            sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    updateStats() {
        document.getElementById('videoCount').textContent = (this.metadata.videos || []).length;
        document.getElementById('notesCount').textContent = (this.metadata.notes || []).length;
        document.getElementById('papersCount').textContent = (this.metadata.pastPapers || []).length;
        document.getElementById('plansCount').textContent = (this.metadata.lessonPlans || []).length;
    }

    showAlert(message, type = 'info') {
        const container = document.getElementById('alertContainer');
        if (!container) return;
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        
        const icons = {
            'success': 'fa-check-circle',
            'error': 'fa-exclamation-circle',
            'info': 'fa-info-circle'
        };
        
        alert.innerHTML = `
            <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(alert);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode === container) {
                alert.style.opacity = '0';
                alert.style.transform = 'translateX(20px)';
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    initEventListeners() {
        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.querySelector('.nav-links');
        
        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                mobileMenuBtn.innerHTML = navLinks.classList.contains('active') 
                    ? '<i class="fas fa-times"></i>' 
                    : '<i class="fas fa-bars"></i>';
            });
        }

        // Show more buttons
        document.querySelectorAll('.toggle-resources').forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.getAttribute('data-section');
                this.toggleShowAll(section);
            });
        });

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        }
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearch();
            });
            
            // Debounced search
            searchInput.addEventListener('input', () => {
                clearTimeout(this.searchTimeout);
                this.searchTimeout = setTimeout(() => {
                    if (searchInput.value.length >= 3) {
                        this.performSearch();
                    }
                }, 500);
            });
        }

        // Backup data link
        const backupLink = document.getElementById('backupLink');
        if (backupLink) {
            backupLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportData();
            });
        }

        // Window resize handling
        window.addEventListener('resize', () => {
            if (!this.focusedSection && !this.currentVideo) {
                this.hideExcessResources();
            }
        });
        
        // Handle browser back/forward for video player
        window.addEventListener('popstate', (event) => {
            if (!event.state || !event.state.videoId) {
                this.backToVideos();
            } else {
                const video = this.metadata.videos?.find(v => v.id === event.state.videoId);
                if (video) {
                    this.playVideoInline(video.id, video.title, video.description, video.subject);
                }
            }
        });
    }

    performSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;
        
        const query = searchInput.value.toLowerCase().trim();
        if (!query || query.length < 2) {
            this.showAlert('Please enter at least 2 characters to search', 'info');
            return;
        }
        
        // Search in all resources
        const allResources = [
            ...(this.metadata.videos || []).map(r => ({ ...r, type: 'videos' })),
            ...(this.metadata.notes || []).map(r => ({ ...r, type: 'notes' })),
            ...(this.metadata.pastPapers || []).map(r => ({ ...r, type: 'papers' })),
            ...(this.metadata.lessonPlans || []).map(r => ({ ...r, type: 'plans' })),
            ...(this.metadata.schemesOfWork || []).map(r => ({ ...r, type: 'schemes' }))
        ];
        
        const results = allResources.filter(resource =>
            resource.title.toLowerCase().includes(query) ||
            resource.description.toLowerCase().includes(query) ||
            (resource.subject && resource.subject.toLowerCase().includes(query)) ||
            (resource.chapter && resource.chapter.toLowerCase().includes(query))
        );
        
        if (results.length > 0) {
            // Reset view first (close video player if open)
            this.backToVideos();
            
            document.querySelectorAll('.resource-section').forEach(section => {
                section.style.display = 'block';
            });
            
            document.querySelectorAll('.resource-grid, .video-grid').forEach(grid => {
                grid.classList.remove('show-all');
            });
            
            document.querySelectorAll('.toggle-resources').forEach(btn => {
                btn.innerHTML = '<i class="fas fa-expand"></i> Show All';
            });
            
            // Hide all resources first
            const sections = ['videos', 'notes', 'papers', 'plans', 'schemes'];
            sections.forEach(section => {
                const grid = document.getElementById(`${section}Grid`);
                if (grid) {
                    const cards = grid.querySelectorAll('.resource-card, .video-card');
                    cards.forEach(card => {
                        card.style.display = 'none';
                    });
                }
            });
            
            // Show matching results
            results.forEach(result => {
                const grid = document.getElementById(`${result.type}Grid`);
                if (grid) {
                    const cards = grid.querySelectorAll('.resource-card, .video-card');
                    cards.forEach(card => {
                        const title = card.querySelector('h3, .video-title')?.textContent.toLowerCase();
                        if (title && title.includes(query)) {
                            card.style.display = 'block';
                        }
                    });
                }
            });
            
            this.showAlert(`Found ${results.length} matching resources`, 'success');
            
            // Scroll to first result
            const firstSection = results[0]?.type;
            if (firstSection) {
                document.getElementById(firstSection)?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                });
            }
        } else {
            this.showAlert('No resources found matching your search', 'info');
        }
        
        searchInput.value = '';
    }

    initNavigation() {
        const sections = document.querySelectorAll('section[id]');
        const navLinks = document.querySelectorAll('.nav-links a');
        
        // Highlight active section on scroll
        const highlightNavOnScroll = () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (scrollY >= (sectionTop - 200)) {
                    current = section.getAttribute('id');
                }
            });
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        };
        
        window.addEventListener('scroll', highlightNavOnScroll);
        
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#') return;
                
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    e.preventDefault();
                    
                    // Close mobile menu if open
                    const navLinks = document.querySelector('.nav-links');
                    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
                    if (navLinks && navLinks.classList.contains('active')) {
                        navLinks.classList.remove('active');
                        if (mobileMenuBtn) {
                            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
                        }
                    }
                    
                    // Close video player if open
                    if (href !== '#videos' && window.academicHub?.currentVideo) {
                        window.academicHub.backToVideos();
                    }
                    
                    // Scroll to target
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    exportData() {
        try {
            // Create a clean copy of metadata without circular references
            const dataToExport = JSON.parse(JSON.stringify(this.metadata));
            
            // Create download link
            const dataStr = JSON.stringify(dataToExport, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const link = document.createElement('a');
            link.setAttribute('href', dataUri);
            link.setAttribute('download', `academic-hub-backup-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showAlert('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showAlert('Failed to export data', 'error');
        }
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.academicHub = new AcademicHub();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key closes video player
    if (e.key === 'Escape' && window.academicHub?.currentVideo) {
        window.academicHub.backToVideos();
    }
    
    // Ctrl+F or Cmd+F focuses search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
        }
    }
});