import { store } from '../store.js';

export function renderRoleSelectionView(container) {
  const currentRole = store.state.currentRole;
  
  container.innerHTML = `
    <div class="view-content" style="padding-top: 3rem;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <div class="user-avatar" style="width: 80px; height: 80px; font-size: 2rem; margin: 0 auto 1rem auto;">
          ${store.state.user.avatar}
        </div>
        <h2 id="user-name-display" style="display:flex; align-items:center; justify-content:center; gap:0.5rem; margin-bottom: 0.25rem;">
          Hello, <span id="user-name-text">${store.state.user.name}</span>
          <button id="btn-edit-name" style="background:none; border:none; color:var(--text-light); cursor:pointer; font-size:1rem;"><i class="fas fa-edit"></i></button>
        </h2>
        <div id="user-name-edit-container" style="display:none; justify-content:center; gap:0.5rem; margin-bottom: 0.5rem;">
          <input type="text" id="input-user-name" class="input-field" value="${store.state.user.name}" style="width: auto; padding: 0.25rem 0.5rem;">
          <button id="btn-save-name" class="btn btn-primary" style="padding: 0.25rem 0.5rem; width: auto;"><i class="fas fa-check"></i></button>
          <button id="btn-cancel-name" class="btn btn-secondary" style="padding: 0.25rem 0.5rem; width: auto;"><i class="fas fa-times"></i></button>
        </div>
        <p>How are you using Rental Hub today?</p>
      </div>

      <div class="role-grid">
        <div class="role-card glass-panel ${currentRole === 'Bachelor' ? 'active' : ''}" data-role="Bachelor">
          <i class="fas fa-user"></i>
          <h3>Bachelor</h3>
        </div>
        <div class="role-card glass-panel ${currentRole === 'Family' ? 'active' : ''}" data-role="Family">
          <i class="fas fa-users"></i>
          <h3>Family</h3>
        </div>
        <div class="role-card glass-panel ${currentRole === 'Business User' ? 'active' : ''}" data-role="Business User">
          <i class="fas fa-briefcase"></i>
          <h3>Business User</h3>
        </div>
        <div class="role-card glass-panel ${currentRole === 'Property Owner' ? 'active' : ''}" data-role="Property Owner">
          <i class="fas fa-key"></i>
          <h3>Property Owner</h3>
        </div>
      </div>
      
      <div style="margin-top: 3rem; text-align: center;">
        <button id="btn-continue" class="btn btn-primary" style="padding: 1rem 2rem; width: auto; min-width: 200px;">
          Continue to Dashboard <i class="fas fa-arrow-right"></i>
        </button>
      </div>
      
      <div style="margin-top: 2rem; text-align: center;">
        <button id="btn-logout" class="btn btn-outline" style="padding: 0.75rem 1.5rem; width: auto;">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </div>
  `;

  // Handle selection
  const cards = container.querySelectorAll('.role-card');
  let selectedRole = currentRole;

  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedRole = card.getAttribute('data-role');
    });
  });

  // Handle Continue
  document.getElementById('btn-continue').addEventListener('click', () => {
    store.setRole(selectedRole);
    window.navigateTo('/home');
  });

  // Handle Logout
  document.getElementById('btn-logout').addEventListener('click', () => {
    store.logout();
    window.navigateTo('/login');
  });

  // Handle Name Edit
  const btnEdit = document.getElementById('btn-edit-name');
  const btnSave = document.getElementById('btn-save-name');
  const btnCancel = document.getElementById('btn-cancel-name');
  const displayContainer = document.getElementById('user-name-display');
  const editContainer = document.getElementById('user-name-edit-container');
  const inputName = document.getElementById('input-user-name');

  if (btnEdit) {
    btnEdit.addEventListener('click', () => {
      displayContainer.style.display = 'none';
      editContainer.style.display = 'flex';
      inputName.focus();
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      displayContainer.style.display = 'flex';
      editContainer.style.display = 'none';
      inputName.value = store.state.user.name;
    });
  }

  if (btnSave) {
    btnSave.addEventListener('click', () => {
      const newName = inputName.value.trim();
      if (newName) {
        store.updateUserName(newName);
        window.navigateTo('/roles');
      }
    });
  }
}
