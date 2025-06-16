import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders main heading', () => {
    render(<App />);
    
    const heading = screen.getByRole('heading', { 
      name: /análisis funcional de holded\.com/i 
    });
    expect(heading).toBeInTheDocument();
  });

  it('displays all 8 modules', () => {
    render(<App />);
    
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
    
    modules.forEach(module => {
      expect(screen.getByText(module)).toBeInTheDocument();
    });
  });

  it('shows module details when clicking on a module', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Click on Facturación module
    const invoicingButton = screen.getByRole('button', { name: /facturación/i });
    await user.click(invoicingButton);
    
    // Check if module details are displayed
    expect(screen.getByText(/sistema completo de facturación electrónica/i)).toBeInTheDocument();
    expect(screen.getByText(/95% adopción/i)).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Click on Technical Architecture tab
    const techTab = screen.getByRole('tab', { name: /arquitectura técnica/i });
    await user.click(techTab);
    
    // Check if technical content is displayed
    expect(screen.getByText(/arquitectura en la nube/i)).toBeInTheDocument();
    expect(screen.getByText(/google cloud platform/i)).toBeInTheDocument();
  });

  it('opens prompt dialog when clicking the button', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Click on "Ver Prompt Especializado" button
    const promptButton = screen.getByRole('button', { name: /ver prompt especializado/i });
    await user.click(promptButton);
    
    // Check if dialog is opened
    await waitFor(() => {
      expect(screen.getByText(/prompt para agente especializado en holded/i)).toBeInTheDocument();
    });
  });

  it('renders statistics correctly', () => {
    render(<App />);
    
    // Check main stats
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('Módulos Principales')).toBeInTheDocument();
    expect(screen.getByText('80+')).toBeInTheDocument();
    expect(screen.getByText('Funcionalidades')).toBeInTheDocument();
    expect(screen.getByText('13+')).toBeInTheDocument();
    expect(screen.getByText('Integraciones')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByText('Automatización')).toBeInTheDocument();
  });

  it('displays integration list in integrations tab', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Switch to integrations tab
    const integrationsTab = screen.getByRole('tab', { name: /integraciones/i });
    await user.click(integrationsTab);
    
    // Check if integrations are displayed
    const integrations = ['Shopify', 'WooCommerce', 'Amazon', 'PayPal', 'Stripe'];
    
    integrations.forEach(integration => {
      expect(screen.getByText(integration)).toBeInTheDocument();
    });
  });

  it('shows API documentation in integrations tab', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Switch to integrations tab
    const integrationsTab = screen.getByRole('tab', { name: /integraciones/i });
    await user.click(integrationsTab);
    
    // Check API endpoints
    expect(screen.getByText(/api rest completa/i)).toBeInTheDocument();
    expect(screen.getByText('GET')).toBeInTheDocument();
    expect(screen.getByText('POST')).toBeInTheDocument();
    expect(screen.getByText('/api/v1/contacts')).toBeInTheDocument();
  });

  it('renders footer with correct information', () => {
    render(<App />);
    
    const footer = screen.getByText(/análisis funcional completo/i);
    expect(footer).toBeInTheDocument();
    
    expect(screen.getByText(/40\+ páginas de análisis/i)).toBeInTheDocument();
    expect(screen.getByText(/25\+ páginas de prompt/i)).toBeInTheDocument();
    expect(screen.getByText(/80\+ funcionalidades/i)).toBeInTheDocument();
  });

  it('handles download PDF button click', async () => {
    const user = userEvent.setup();
    
    // Mock createElement and click
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
      remove: vi.fn()
    };
    
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    
    render(<App />);
    
    // Click download button
    const downloadButton = screen.getByRole('button', { name: /descargar pdf/i });
    await user.click(downloadButton);
    
    // Verify link was created and clicked
    expect(mockLink.href).toBe('/analisis_funcional_holded.pdf');
    expect(mockLink.download).toBe('Analisis_Funcional_Holded.pdf');
    expect(mockLink.click).toHaveBeenCalled();
  });

  it('displays module features correctly', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // Click on Accounting module
    const accountingButton = screen.getByText('Contabilidad').closest('button');
    await user.click(accountingButton);
    
    // Check if features are displayed
    expect(screen.getByText(/automatización del 95% de tareas contables/i)).toBeInTheDocument();
    expect(screen.getByText(/sincronización con \+300 bancos/i)).toBeInTheDocument();
    expect(screen.getByText(/generación automática de modelos fiscales/i)).toBeInTheDocument();
  });

  it('shows progress bars for module usage', () => {
    render(<App />);
    
    // Check if progress bars are rendered
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
  });
});