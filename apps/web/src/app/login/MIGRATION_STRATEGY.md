# Login Page Migration Strategy

## Current State Analysis

### Legacy Login Page (`/src/pages/Login.tsx`)

- Uses React Router for navigation
- Has dark/light mode toggle
- Includes social login options (Google, Apple, X)
- Uses Framer Motion for animations
- Has comprehensive form validation
- Uses Tailwind CSS for styling

### Next.js Login Page (`/apps/web/src/app/login/page.tsx`)

- Server component with client-side interactivity
- Uses Next.js App Router
- Has existing authentication functionality
- Simpler UI with Google login only
- Custom CSS styling

## Migration Steps

1. **UI Component Migration**
   - Preserve the existing authentication logic from Next.js implementation
   - Port the visual design from legacy login page
   - Add dark/light mode support
   - Implement Framer Motion animations
   - Add missing social login options

2. **Component Structure**
   ```
   /login
   ├── page.tsx            # Server Component (Layout)
   ├── login-form.tsx      # Client Component (Form + Interactivity)
   ├── theme-toggle.tsx    # Client Component (Dark Mode)
   └── login.styles.css    # Styles
   ```

3. **Implementation Order**
   a. Create client components for interactive elements
   b. Update styling using Tailwind (maintain existing classes)
   c. Add dark mode functionality
   d. Implement animations
   e. Add social login buttons
   f. Integrate existing auth logic

4. **Key Considerations**
   - Keep existing Next.js authentication flow
   - Use 'use client' directive for interactive components
   - Maintain accessibility features
   - Follow mobile-first responsive design
   - Preserve existing auth security measures

## Testing Strategy
1. Visual comparison with legacy page
2. Authentication flow testing
3. Responsive design verification
4. Dark mode functionality
5. Animation smoothness
6. Social login integration

## Questions to Resolve
1. Should we keep both CSS approaches or standardize on Tailwind?
2. Do we need to support all social login providers immediately?
3. How should we handle the theme state management in Next.js?
