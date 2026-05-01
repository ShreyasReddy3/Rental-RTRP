import { store } from '../store.js';

export function renderOwnerDashboard(container) {
  const myProperties = store.getFilteredProperties();

  // Pending booking requests mock logic
  const pendingRequests = store.state.bookings.filter(b => b.property.ownerId === 'me' && b.status === 'Pending');

  let html = `
    <div class="view-content">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <h2 style="margin: 0;">My Properties</h2>
          <p style="color: var(--text-light); font-size: 0.9rem; margin: 0;">Manage your listings</p>
        </div>
        <button id="add-property-btn" class="btn btn-primary" style="width: auto; padding: 0.5rem 1rem; border-radius: var(--border-radius-md);">
          <i class="fas fa-plus"></i> Add New
        </button>
      </div>

      <!-- Dashboard Stats -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem;">
        <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--border-radius-lg); text-align: center;">
          <div style="font-size: 2rem; font-weight: 700; color: var(--primary);">${myProperties.length}</div>
          <div style="font-size: 0.9rem; color: var(--text-light);">Active Listings</div>
        </div>
        <div class="glass-panel" style="padding: 1.5rem; border-radius: var(--border-radius-lg); text-align: center; position: relative;">
          ${pendingRequests.length > 0 ? `<div style="position: absolute; top: 0.5rem; right: 0.5rem; width: 12px; height: 12px; background: var(--danger); border-radius: 50%;"></div>` : ''}
          <div style="font-size: 2rem; font-weight: 700; color: var(--accent);">${pendingRequests.length}</div>
          <div style="font-size: 0.9rem; color: var(--text-light);">Pending Requests</div>
        </div>
      </div>

      <!-- Bookings Section (Mocked) -->
      ${pendingRequests.length > 0 ? `
        <h3 style="margin-bottom: 1rem;">Booking Requests</h3>
        <div style="margin-bottom: 2rem; display:flex; flex-direction:column; gap:1rem;">
          ${pendingRequests.map(req => `
            <div class="glass-panel" style="padding: 1rem; border-radius: var(--border-radius-md); display:flex; flex-direction:column; gap:0.5rem;">
              <div style="display:flex; justify-content:space-between;">
                <strong>${req.property.title}</strong>
                <span class="badge badge-warning">Pending</span>
              </div>
              <div style="font-size: 0.85rem; color: var(--text-light);">
                Requested by User on ${req.date}
              </div>
              <div style="display:flex; gap:0.5rem; margin-top:0.5rem;">
                <button class="btn btn-secondary" style="padding: 0.5rem; flex:1;" onclick="alert('Accepted!')">Accept</button>
                <button class="btn" style="background:var(--danger); color:white; padding: 0.5rem; flex:1;" onclick="alert('Rejected!')">Reject</button>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <h3 style="margin-bottom: 1rem;">Your Listings</h3>
      ${myProperties.length > 0 ? myProperties.map(p => `
        <div class="glass-panel" style="display: flex; gap: 1rem; padding: 1rem; border-radius: var(--border-radius-lg); margin-bottom: 1rem;">
          <img src="${p.image}" style="width: 80px; height: 80px; border-radius: var(--border-radius-sm); object-fit: cover;">
          <div style="flex: 1; display:flex; flex-direction:column; justify-content:space-between;">
            <div>
              <div style="font-weight: 600; font-size: 1rem; margin-bottom: 0.25rem;">${p.title}</div>
              <div style="color: var(--primary); font-weight: 700;">$${p.price}<span style="font-size:0.8rem; color:var(--text-light); font-weight:400">/mo</span></div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:flex-end;">
              <span style="font-size: 0.8rem; color: var(--text-light);"><i class="fas fa-eye"></i> 124 views</span>
              <div style="display:flex; gap: 0.5rem;">
                <button style="background:none; border:none; color:var(--text-light); cursor:pointer;"><i class="fas fa-edit"></i></button>
                <button style="background:none; border:none; color:var(--danger); cursor:pointer;" onclick="window.store.deleteProperty(${p.id}); window.navigateTo('/home');"><i class="fas fa-trash"></i></button>
              </div>
            </div>
          </div>
        </div>
      `).join('') : `
        <div style="text-align:center; padding: 2rem 1rem; color: var(--text-light)">
          <i class="fas fa-home" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5"></i>
          <p>You haven't listed any properties yet.</p>
        </div>
      `}
    </div>
  `;

  // Add Property Modal
  const modalContainer = document.getElementById('modal-container');
  if (modalContainer) {
    modalContainer.innerHTML = `
      <div class="modal-overlay" id="add-property-modal">
        <div class="modal-content">
          <div class="modal-handle"></div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 1.5rem;">
             <h2 style="margin:0">Add New Listing</h2>
             <i class="fas fa-times" style="font-size:1.5rem; color:var(--text-light); cursor:pointer;" onclick="document.getElementById('add-property-modal').classList.remove('active')"></i>
          </div>
          
          <form id="add-property-form">
            <div style="display:flex; flex-direction:column; gap: 1rem; margin-bottom: 1.5rem;">
              <div style="width:100%; min-height:120px; border:2px dashed var(--glass-border); border-radius:var(--border-radius-md); display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--text-light); cursor:pointer; position: relative; overflow: hidden;">
                <input type="file" id="p-image" accept="image/*" style="position: absolute; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 10;">
                <div id="image-preview" style="padding: 1.5rem; text-align: center; width: 100%;">
                  <i class="fas fa-cloud-upload-alt" style="font-size:2rem; margin-bottom:0.5rem; color:var(--primary);"></i>
                  <div>Upload Image</div>
                </div>
              </div>
              
              <input type="text" id="p-title" class="input-field" placeholder="Property Title" required>
              
              <div style="display:flex; gap:1rem;">
                <select id="p-type" class="input-field" style="flex:1" required>
                  <option value="" disabled selected>Type</option>
                  <option value="Room">Room</option>
                  <option value="Apartment">Apartment</option>
                  <option value="House">House</option>
                  <option value="Shop">Shop</option>
                </select>
                <input type="number" id="p-price" class="input-field" style="flex:1" placeholder="Rent/mo ($)" required>
              </div>
              
              <input type="text" id="p-location" class="input-field" placeholder="Location" required>
              
              <div style="font-size:0.9rem; margin-top:0.5rem;">Target Audience:</div>
              <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                <label style="display:flex; align-items:center; gap:0.25rem;"><input type="checkbox" name="target" value="Bachelor"> Bachelor</label>
                <label style="display:flex; align-items:center; gap:0.25rem;"><input type="checkbox" name="target" value="Family"> Family</label>
                <label style="display:flex; align-items:center; gap:0.25rem;"><input type="checkbox" name="target" value="Business User"> Business User</label>
              </div>
            </div>
            
            <button type="submit" class="btn btn-primary">List Property</button>
          </form>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  // Listeners
  const addBtn = document.getElementById('add-property-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      document.getElementById('add-property-modal').classList.add('active');
    });
  }

  const addForm = document.getElementById('add-property-form');
  if (addForm) {
    let selectedImageBase64 = null;
    const imageInput = document.getElementById('p-image');
    const imagePreview = document.getElementById('image-preview');

    if (imageInput && imagePreview) {
      imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            selectedImageBase64 = e.target.result;
            imagePreview.innerHTML = `<img src="${selectedImageBase64}" style="width: 100%; height: 120px; object-fit: cover; border-radius: var(--border-radius-sm);">`;
            imagePreview.style.padding = '0';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    addForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const title = document.getElementById('p-title').value;
      const type = document.getElementById('p-type').value;
      const price = document.getElementById('p-price').value;
      const location = document.getElementById('p-location').value;

      const targets = [];
      document.querySelectorAll('input[name="target"]:checked').forEach(el => targets.push(el.value));

      const finalImage = selectedImageBase64 || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80';

      store.addProperty({
        title,
        type,
        price,
        location,
        distance: '0 km',
        amenities: [],
        image: finalImage,
        target: targets
      });

      document.getElementById('add-property-modal').classList.remove('active');
      window.navigateTo('/home'); // Re-render
    });
  }
}
