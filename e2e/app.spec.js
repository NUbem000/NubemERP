import { test, expect } from '@playwright/test';

test.describe('Holded Analysis App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('has correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Holded Analysis/);
  });

  test('displays main heading', async ({ page }) => {
    const heading = page.getByRole('heading', { name: /análisis funcional de holded\.com/i });
    await expect(heading).toBeVisible();
  });

  test('shows all 8 modules', async ({ page }) => {
    const modules = [
      'Facturación',
      'Contabilidad', 
      'Proyectos',
      'Inventario',
      'Recursos Humanos',
      'CRM',
      'TPV',
      'Sistema'
    ];

    for (const module of modules) {
      await expect(page.getByText(module).first()).toBeVisible();
    }
  });

  test('can switch between tabs', async ({ page }) => {
    // Click on Technical Architecture tab
    await page.getByRole('tab', { name: /arquitectura técnica/i }).click();
    
    // Verify content changed
    await expect(page.getByText(/arquitectura en la nube/i)).toBeVisible();
    await expect(page.getByText(/google cloud platform/i)).toBeVisible();
    
    // Switch to Integrations tab
    await page.getByRole('tab', { name: /integraciones/i }).click();
    
    // Verify integrations are shown
    await expect(page.getByText('Shopify')).toBeVisible();
    await expect(page.getByText('WooCommerce')).toBeVisible();
  });

  test('module selection works correctly', async ({ page }) => {
    // Click on Accounting module
    await page.getByRole('button', { name: /contabilidad/i }).click();
    
    // Check if details are displayed
    await expect(page.getByText(/automatización del 95% de tareas contables/i)).toBeVisible();
    await expect(page.getByText(/88% adopción/i)).toBeVisible();
  });

  test('prompt dialog opens and closes', async ({ page }) => {
    // Click on prompt button
    await page.getByRole('button', { name: /ver prompt especializado/i }).click();
    
    // Check dialog is visible
    await expect(page.getByText(/prompt para agente especializado en holded/i)).toBeVisible();
    
    // Close dialog
    await page.keyboard.press('Escape');
    
    // Check dialog is closed
    await expect(page.getByText(/prompt para agente especializado en holded/i)).not.toBeVisible();
  });

  test('download PDF button is clickable', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    
    // Intercept the download
    await page.route('**/analisis_funcional_holded.pdf', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: Buffer.from('PDF content')
      });
    });
    
    // Click download button
    await page.getByRole('button', { name: /descargar pdf/i }).click();
    
    // Verify download started (in real scenario)
    // const download = await downloadPromise;
    // expect(download.suggestedFilename()).toBe('Analisis_Funcional_Holded.pdf');
  });

  test('responsive design works', async ({ page, viewport }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if content is still accessible
    await expect(page.getByRole('heading', { name: /análisis funcional/i })).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.getByRole('heading', { name: /análisis funcional/i })).toBeVisible();
  });

  test('charts are rendered', async ({ page }) => {
    // Wait for charts to render
    await page.waitForSelector('.recharts-wrapper', { timeout: 5000 });
    
    // Check if charts exist
    const charts = await page.locator('.recharts-wrapper').count();
    expect(charts).toBeGreaterThan(0);
  });

  test('footer contains correct information', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check footer content
    await expect(page.getByText(/40\+ páginas de análisis/i)).toBeVisible();
    await expect(page.getByText(/25\+ páginas de prompt/i)).toBeVisible();
    await expect(page.getByText(/80\+ funcionalidades/i)).toBeVisible();
  });

  test('progress bars are displayed', async ({ page }) => {
    const progressBars = page.locator('[role="progressbar"]');
    const count = await progressBars.count();
    expect(count).toBeGreaterThan(0);
  });

  test('API documentation is shown in integrations tab', async ({ page }) => {
    // Navigate to integrations tab
    await page.getByRole('tab', { name: /integraciones/i }).click();
    
    // Check API examples
    await expect(page.getByText('/api/v1/contacts')).toBeVisible();
    await expect(page.getByText('/api/v1/documents')).toBeVisible();
  });
});