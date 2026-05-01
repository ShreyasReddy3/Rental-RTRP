import { store } from './store.js';
window.store = store;

// Views
import { renderLoginView } from './views/LoginView.js';
import { renderRoleSelectionView } from './views/RoleSelectionView.js';
import { renderTenantDashboard } from './views/TenantDashboard.js';
import { renderOwnerDashboard } from './views/OwnerDashboard.js';
import { renderPropertyDetailView } from './views/PropertyDetailView.js';

class AppRouter {
  constructor() {
    this.appElement = document.getElementById('app');
    this.currentPath = '/';
    this.init();
  }

  init() {
    // Listen for state changes to re-render if necessary
    store.subscribe((state) => {
      // Re-render header or specific elements if needed
      // Currently simple: re-render full view on role change
      if (this.currentPath === '/home') {
        this.navigate('/home');
      }
    });

    // Check if user is logged in (mock)
    const isLoggedIn = localStorage.getItem('rental_logged_in');
    if (!isLoggedIn) {
      this.navigate('/login');
    } else {
      this.navigate('/home');
    }

    // Global navigation handler
    window.addEventListener('navigate', (e) => {
      this.navigate(e.detail.path, e.detail.data);
    });
  }

  navigate(path, data = null) {
    this.currentPath = path;
    this.appElement.innerHTML = ''; // Clear current view

    // Create base layout for authenticated views
    if (path !== '/login' && path !== '/property-detail') {
      this.appElement.innerHTML = `
        <header class="app-header glass-panel" style="border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg); display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; position: relative; z-index: 1000;">
          <div>
            <h2 style="margin:0; font-size: 1.25rem; font-weight: 700;">Rental<span style="color:var(--primary)">Hub</span></h2>
            <div style="font-size: 0.75rem; color: var(--text-light)">Mode: <span id="header-role-text">${store.state.currentRole}</span></div>
          </div>
          <div style="display: flex; gap: 1rem; align-items: center;">
            <div id="notification-bell" style="position: relative; cursor: pointer;">
              <i class="fas fa-bell" style="font-size: 1.25rem; color: var(--text-color);"></i>
              ${store.state.notifications.filter(n => !n.read).length > 0 ? `<div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: var(--danger); border-radius: 50%;"></div>` : ''}
            </div>
            <div class="user-avatar" onclick="window.dispatchEvent(new CustomEvent('navigate', {detail: {path: '/roles'}}))">
              ${store.state.user.avatar}
            </div>
          </div>
          <div id="notifications-dropdown" class="glass-panel" style="display: none; position: absolute; top: 100%; right: 1.5rem; width: 300px; max-height: 400px; overflow-y: auto; padding: 1rem; border-radius: var(--border-radius-md); box-shadow: var(--shadow-lg); z-index: 1000; flex-direction: column; gap: 0.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.5rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem;">
              <h4 style="margin:0">Notifications</h4>
              <button class="btn btn-sm" style="padding: 0.2rem 0.5rem; font-size: 0.75rem; background:none; color:var(--primary)" id="mark-read-btn">Mark All Read</button>
            </div>
            ${store.state.notifications.length === 0 ? `<p style="font-size:0.85rem; color:var(--text-light); text-align:center;">No notifications</p>` : ''}
            ${store.state.notifications.map(n => `
              <div style="padding: 0.5rem; border-radius: var(--border-radius-sm); background: ${n.read ? 'transparent' : 'rgba(79, 70, 229, 0.05)'}; border-left: 3px solid ${n.type === 'success' ? 'var(--secondary)' : n.type === 'danger' ? 'var(--danger)' : 'var(--primary)'}">
                <strong style="font-size: 0.85rem; display:block">${n.title}</strong>
                <span style="font-size: 0.75rem; color: var(--text-light)">${n.message}</span>
              </div>
            `).join('')}
          </div>
        </header>
        <div id="view-container" class="view-container"></div>
        <nav class="bottom-nav glass-panel">
          <a class="nav-item ${path === '/home' ? 'active' : ''}" onclick="window.dispatchEvent(new CustomEvent('navigate', {detail: {path: '/home'}}))">
            <i class="fas fa-home"></i>
            <span>Home</span>
          </a>
          <a class="nav-item ${path === '/search' ? 'active' : ''}" onclick="window.dispatchEvent(new CustomEvent('navigate', {detail: {path: '/search'}}))">
            <i class="fas fa-search"></i>
            <span>Search</span>
          </a>
          <a class="nav-item ${path === '/bookings' ? 'active' : ''}" onclick="window.dispatchEvent(new CustomEvent('navigate', {detail: {path: '/bookings'}}))">
            <i class="fas fa-calendar-check"></i>
            <span>Bookings</span>
          </a>
          <a class="nav-item ${path === '/roles' ? 'active' : ''}" onclick="window.dispatchEvent(new CustomEvent('navigate', {detail: {path: '/roles'}}))">
            <i class="fas fa-user-circle"></i>
            <span>Profile</span>
          </a>
        </nav>
        <div id="modal-container"></div>
      `;
    } else {
      this.appElement.innerHTML = `
        <div id="view-container" class="view-container"></div>
        <div id="modal-container"></div>
      `;
    }

    const viewContainer = document.getElementById('view-container');

    switch (path) {
      case '/login':
        renderLoginView(viewContainer);
        break;
      case '/roles':
        renderRoleSelectionView(viewContainer);
        break;
      case '/home':
      case '/search':
        if (store.state.currentRole === 'Property Owner') {
          renderOwnerDashboard(viewContainer);
        } else {
          renderTenantDashboard(viewContainer, path === '/search');
        }
        break;
      case '/property-detail':
        renderPropertyDetailView(viewContainer, data);
        break;
      case '/bookings':
        this.renderBookingsView(viewContainer);
        break;
      default:
        this.navigate('/home');
    }
  }

  renderBookingsView(container) {
    container.innerHTML = `
      <div class="view-content">
        <h2>My Bookings</h2>
        <p>Manage your requests and stays.</p>
        
        ${store.state.bookings.length === 0 ? `
          <div style="text-align:center; padding: 3rem 1rem; color: var(--text-light)">
            <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5"></i>
            <h3>No Bookings Yet</h3>
            <p>You haven't made any booking requests.</p>
          </div>
        ` : `
          <div style="display:flex; flex-direction:column; gap:1rem;">
            ${store.state.bookings.map(b => {
              let badgeClass = 'badge-warning';
              if (b.status === 'Accepted') badgeClass = 'badge-success';
              if (b.status === 'Rejected') badgeClass = 'badge-danger';
              return `
              <div class="glass-panel" style="padding: 1rem; border-radius: var(--border-radius-md)">
                <div style="display:flex; justify-content:space-between; margin-bottom: 0.5rem">
                  <strong>${b.property.title}</strong>
                  <span class="badge ${badgeClass}">${b.status}</span>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-light)">
                  Requested on: ${b.date}
                </div>
                ${b.status === 'Accepted' ? `
                  <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary" style="flex:1; padding: 0.5rem" onclick="window.navigateTo('/property-detail', ${b.property.id})">View Property</button>
                  </div>
                ` : ''}
              </div>
            `}).join('')}
          </div>
        `}
      </div>
    `;

    // Attach notification bell listeners after rendering
    setTimeout(() => {
      const bell = document.getElementById('notification-bell');
      const dropdown = document.getElementById('notifications-dropdown');
      const markReadBtn = document.getElementById('mark-read-btn');
      
      if (bell && dropdown) {
        bell.addEventListener('click', () => {
          dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
        });
      }
      if (markReadBtn) {
        markReadBtn.addEventListener('click', () => {
          store.markNotificationsRead();
          dropdown.style.display = 'none';
        });
      }
    }, 0);
  }
}

// Global helper to trigger navigation
window.navigateTo = (path, data = null) => {
  window.dispatchEvent(new CustomEvent('navigate', { detail: { path, data } }));
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  new AppRouter();
});
