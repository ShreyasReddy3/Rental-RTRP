export function renderLoginView(container) {
  let isLogin = true;

  const renderForm = () => {
    container.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; justify-content: center; padding: 2rem; background: linear-gradient(135deg, var(--bg-color) 0%, rgba(79, 70, 229, 0.1) 100%);">
        <div style="text-align: center; margin-bottom: 3rem; animation: fadeIn 0.6s ease-out;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, var(--primary), var(--primary-light)); border-radius: 24px; margin: 0 auto 1.5rem auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px rgba(79, 70, 229, 0.3); transform: rotate(-10deg);">
            <i class="fas fa-home" style="font-size: 2.5rem; color: white; transform: rotate(10deg);"></i>
          </div>
          <h1 style="font-size: 2.5rem; margin-bottom: 0.5rem; background: linear-gradient(135deg, var(--primary-dark), var(--primary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Rental Hub</h1>
          <p style="font-size: 1.1rem;">Find your perfect space, anywhere.</p>
        </div>

        <div class="glass-panel" style="padding: 2rem; border-radius: var(--border-radius-lg); animation: fadeIn 0.8s ease-out;">
          <h2 style="margin-bottom: 1.5rem; text-align: center;">${isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
          
          <form id="auth-form">
            ${!isLogin ? `
            <div class="input-group">
              <i class="fas fa-user"></i>
              <input type="text" id="auth-name" class="input-field" placeholder="Full Name" required>
            </div>
            ` : ''}

            <div class="input-group">
              <i class="fas fa-envelope"></i>
              <input type="email" id="auth-email" class="input-field" placeholder="Email Address" required value="${isLogin ? 'user@example.com' : ''}">
            </div>
            
            <div class="input-group">
              <i class="fas fa-lock"></i>
              <input type="password" id="auth-password" class="input-field" placeholder="Password" required value="${isLogin ? 'password' : ''}">
            </div>
            
            ${isLogin ? `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; font-size: 0.85rem;">
              <label style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-light); cursor: pointer;">
                <input type="checkbox" checked> Remember me
              </label>
              <a href="#" style="color: var(--primary); text-decoration: none; font-weight: 500;">Forgot Password?</a>
            </div>
            ` : `
            <div class="input-group" style="margin-bottom: 1.5rem;">
              <i class="fas fa-briefcase"></i>
              <select id="auth-role" class="input-field" required>
                <option value="" disabled selected>Primary Role</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Family">Family</option>
                <option value="Business User">Business User</option>
                <option value="Property Owner">Property Owner</option>
              </select>
            </div>
            `}
            
            <button type="submit" class="btn btn-primary" style="font-size: 1.1rem; padding: 1rem; width: 100%;">
              ${isLogin ? 'Sign In' : 'Sign Up'} <i class="fas fa-arrow-right" style="margin-left: 0.5rem;"></i>
            </button>
          </form>
          
          <div style="text-align: center; margin-top: 1.5rem; font-size: 0.9rem; color: var(--text-light);">
            ${isLogin ? "Don't have an account? " : "Already have an account? "} 
            <a href="#" id="toggle-auth" style="color: var(--primary); font-weight: 600; text-decoration: none;">${isLogin ? 'Sign Up' : 'Sign In'}</a>
          </div>
        </div>
      </div>
    `;

    document.getElementById('toggle-auth').addEventListener('click', (e) => {
      e.preventDefault();
      isLogin = !isLogin;
      renderForm();
    });

    document.getElementById('auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      
      try {
        if (isLogin) {
          await window.store.login(email, password);
        } else {
          const name = document.getElementById('auth-name').value;
          const role = document.getElementById('auth-role').value;
          await window.store.register(name, email, password, role);
        }
        window.navigateTo('/roles');
      } catch (err) {
        alert(err.message);
      }
    });
  };

  renderForm();
}
