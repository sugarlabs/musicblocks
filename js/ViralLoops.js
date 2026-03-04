// Copyright (c) 2026 Music Blocks Contributors
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the The GNU Affero General Public
// License as published by the Free Software Foundation; either
// version 3 of the License, or (at your option) any later version.
//
// You should have received a copy of the GNU Affero General Public
// License along with this library; if not, write to the Free Software
// Foundation, 51 Franklin Street, Suite 500 Boston, MA 02110-1335 USA

/*
   globals _, docById
*/

/*
   exported ViralLoops
*/

/**
 * ViralLoops - Manages viral growth features for Music Blocks
 * Includes social sharing, referral tracking, and engagement features
 */
class ViralLoops {
    constructor(activity) {
        this.activity = activity;
        this.referralCode = null;
        this.shareCount = 0;
        this.achievements = [];
        
        this._initReferralTracking();
        this._loadAchievements();
    }

    /**
     * Initialize referral tracking from URL parameters
     */
    _initReferralTracking() {
        const urlParams = new URLSearchParams(window.location.search);
        const ref = urlParams.get('ref');
        
        if (ref) {
            this._trackReferral(ref);
        }
        
        // Generate unique referral code for current user
        this.referralCode = this._generateReferralCode();
    }

    /**
     * Generate a unique referral code
     */
    _generateReferralCode() {
        const stored = localStorage.getItem('mb_referral_code');
        if (stored) return stored;
        
        const code = 'MB' + Math.random().toString(36).substring(2, 8).toUpperCase();
        localStorage.setItem('mb_referral_code', code);
        return code;
    }

    /**
     * Track when someone arrives via referral
     */
    _trackReferral(referrerCode) {
        const referrals = JSON.parse(localStorage.getItem('mb_referrals') || '[]');
        
        if (!referrals.includes(referrerCode)) {
            referrals.push({
                code: referrerCode,
                timestamp: Date.now()
            });
            localStorage.setItem('mb_referrals', JSON.stringify(referrals));
        }
    }

    /**
     * Load user achievements
     */
    _loadAchievements() {
        this.achievements = JSON.parse(localStorage.getItem('mb_achievements') || '[]');
        this.shareCount = parseInt(localStorage.getItem('mb_share_count') || '0');
    }

    /**
     * Save achievements
     */
    _saveAchievements() {
        localStorage.setItem('mb_achievements', JSON.stringify(this.achievements));
        localStorage.setItem('mb_share_count', this.shareCount.toString());
    }

    /**
     * Award achievement
     */
    _awardAchievement(achievementId, title, description) {
        if (this.achievements.includes(achievementId)) return;
        
        this.achievements.push(achievementId);
        this._saveAchievements();
        this._showAchievementNotification(title, description);
    }

    /**
     * Show achievement notification
     */
    _showAchievementNotification(title, description) {
        const notification = document.createElement('div');
        notification.className = 'viral-achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <i class="material-icons">emoji_events</i>
                <div>
                    <strong>${title}</strong>
                    <p>${description}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    /**
     * Track share action and check for achievements
     */
    trackShare(platform) {
        this.shareCount++;
        this._saveAchievements();
        
        // Check for share achievements
        if (this.shareCount === 1) {
            this._awardAchievement('first_share', _('First Share!'), _('You shared your first project'));
        } else if (this.shareCount === 5) {
            this._awardAchievement('social_butterfly', _('Social Butterfly'), _('Shared 5 projects'));
        } else if (this.shareCount === 10) {
            this._awardAchievement('influencer', _('Influencer'), _('Shared 10 projects'));
        }
        
        // Track platform-specific shares
        const platformShares = JSON.parse(localStorage.getItem('mb_platform_shares') || '{}');
        platformShares[platform] = (platformShares[platform] || 0) + 1;
        localStorage.setItem('mb_platform_shares', JSON.stringify(platformShares));
    }

    /**
     * Generate share URL with referral code
     */
    generateShareURL(projectId = null, options = {}) {
        const baseURL = window.location.origin + window.location.pathname;
        const params = new URLSearchParams();
        
        params.set('ref', this.referralCode);
        
        if (projectId) {
            params.set('id', projectId);
        }
        
        if (options.run) params.set('run', 'True');
        if (options.show) params.set('show', 'True');
        if (options.collapse) params.set('collapse', 'True');
        
        return `${baseURL}?${params.toString()}`;
    }

    /**
     * Share to Twitter/X
     */
    shareToTwitter(projectTitle, projectId = null) {
        const url = this.generateShareURL(projectId, { run: true });
        const text = _('Check out my Music Blocks project: ') + projectTitle;
        const twitterURL = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=MusicBlocks,Coding,Music`;
        
        this.trackShare('twitter');
        window.open(twitterURL, '_blank', 'width=550,height=420');
    }

    /**
     * Share to Facebook
     */
    shareToFacebook(projectId = null) {
        const url = this.generateShareURL(projectId, { run: true });
        const facebookURL = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        
        this.trackShare('facebook');
        window.open(facebookURL, '_blank', 'width=550,height=420');
    }

    /**
     * Share to WhatsApp
     */
    shareToWhatsApp(projectTitle, projectId = null) {
        const url = this.generateShareURL(projectId, { run: true });
        const text = _('Check out my Music Blocks project: ') + projectTitle + ' ' + url;
        const whatsappURL = `https://wa.me/?text=${encodeURIComponent(text)}`;
        
        this.trackShare('whatsapp');
        window.open(whatsappURL, '_blank');
    }

    /**
     * Share via email
     */
    shareViaEmail(projectTitle, projectId = null) {
        const url = this.generateShareURL(projectId, { run: true });
        const subject = _('Check out my Music Blocks project!');
        const body = _('I created this music project with Music Blocks. Check it out: ') + url;
        const mailtoURL = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        this.trackShare('email');
        window.location.href = mailtoURL;
    }

    /**
     * Copy share link to clipboard
     */
    async copyShareLink(projectId = null) {
        const url = this.generateShareURL(projectId, { run: true });
        
        try {
            await navigator.clipboard.writeText(url);
            this.trackShare('clipboard');
            return true;
        } catch (err) {
            console.error('Failed to copy:', err);
            return false;
        }
    }

    /**
     * Show social share modal
     */
    showShareModal(projectTitle, projectId = null, projectImage = null) {
        const modal = document.createElement('div');
        modal.className = 'viral-share-modal';
        modal.innerHTML = `
            <div class="viral-share-content">
                <div class="viral-share-header">
                    <h3>${_('Share Your Project')}</h3>
                    <button class="viral-close-btn" onclick="this.closest('.viral-share-modal').remove()">
                        <i class="material-icons">close</i>
                    </button>
                </div>
                
                ${projectImage ? `<img src="${projectImage}" class="viral-share-preview" alt="Project preview">` : ''}
                
                <p class="viral-share-description">${_('Share your creation with friends and inspire others to make music!')}</p>
                
                <div class="viral-share-buttons">
                    <button class="viral-share-btn twitter" data-platform="twitter">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        ${_('Twitter')}
                    </button>
                    
                    <button class="viral-share-btn facebook" data-platform="facebook">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                        ${_('Facebook')}
                    </button>
                    
                    <button class="viral-share-btn whatsapp" data-platform="whatsapp">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        ${_('WhatsApp')}
                    </button>
                    
                    <button class="viral-share-btn email" data-platform="email">
                        <i class="material-icons">email</i>
                        ${_('Email')}
                    </button>
                    
                    <button class="viral-share-btn copy" data-platform="copy">
                        <i class="material-icons">content_copy</i>
                        ${_('Copy Link')}
                    </button>
                </div>
                
                <div class="viral-referral-info">
                    <p>${_('Your referral code:')} <strong>${this.referralCode}</strong></p>
                    <p class="viral-share-stats">${_('Projects shared:')} ${this.shareCount}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelectorAll('.viral-share-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = e.currentTarget.dataset.platform;
                
                switch(platform) {
                    case 'twitter':
                        this.shareToTwitter(projectTitle, projectId);
                        break;
                    case 'facebook':
                        this.shareToFacebook(projectId);
                        break;
                    case 'whatsapp':
                        this.shareToWhatsApp(projectTitle, projectId);
                        break;
                    case 'email':
                        this.shareViaEmail(projectTitle, projectId);
                        break;
                    case 'copy':
                        this.copyShareLink(projectId).then(success => {
                            if (success) {
                                e.currentTarget.innerHTML = '<i class="material-icons">check</i>' + _('Copied!');
                                setTimeout(() => {
                                    e.currentTarget.innerHTML = '<i class="material-icons">content_copy</i>' + _('Copy Link');
                                }, 2000);
                            }
                        });
                        break;
                }
            });
        });
        
        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Show achievement progress
     */
    showAchievements() {
        const modal = document.createElement('div');
        modal.className = 'viral-share-modal';
        
        const achievementsList = [
            { id: 'first_share', title: _('First Share'), description: _('Share your first project'), unlocked: this.achievements.includes('first_share') },
            { id: 'social_butterfly', title: _('Social Butterfly'), description: _('Share 5 projects'), unlocked: this.achievements.includes('social_butterfly') },
            { id: 'influencer', title: _('Influencer'), description: _('Share 10 projects'), unlocked: this.achievements.includes('influencer') }
        ];
        
        const achievementsHTML = achievementsList.map(ach => `
            <div class="viral-achievement-item ${ach.unlocked ? 'unlocked' : 'locked'}">
                <i class="material-icons">${ach.unlocked ? 'emoji_events' : 'lock'}</i>
                <div>
                    <strong>${ach.title}</strong>
                    <p>${ach.description}</p>
                </div>
            </div>
        `).join('');
        
        modal.innerHTML = `
            <div class="viral-share-content">
                <div class="viral-share-header">
                    <h3>${_('Your Achievements')}</h3>
                    <button class="viral-close-btn" onclick="this.closest('.viral-share-modal').remove()">
                        <i class="material-icons">close</i>
                    </button>
                </div>
                
                <div class="viral-achievements-list">
                    ${achievementsHTML}
                </div>
                
                <div class="viral-referral-info">
                    <p>${_('Keep sharing to unlock more achievements!')}</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}
