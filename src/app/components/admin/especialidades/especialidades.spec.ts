import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EspecialidadesComponent } from './especialidades';
import { EspecialidadService, Especialidad } from '../../../services/especialidad';
import { AuthService } from '../../../services/auth';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('EspecialidadesComponent', () => {
  let component: EspecialidadesComponent;
  let fixture: ComponentFixture<EspecialidadesComponent>;
  let especialidadServiceSpy: any;
  let authServiceSpy: any;
  let routerSpy: any;

  const mockEspecialidades: Especialidad[] = [
    { id: 1, nombre: 'Cardiología', descripcion: 'Diagnóstico y tratamiento cardiovascular' },
    { id: 2, nombre: 'Pediatría', descripcion: 'Atención médica integral infantil' },
    { id: 3, nombre: 'Traumatología', descripcion: 'Aparato locomotor' }
  ];

  beforeEach(async () => {
    especialidadServiceSpy = {
      getEspecialidades: vi.fn().mockReturnValue(of(mockEspecialidades)),
      crearEspecialidad: vi.fn(),
      actualizarEspecialidad: vi.fn()
    };

    authServiceSpy = {
      hasRole: vi.fn().mockReturnValue(true),
      currentUser: vi.fn().mockReturnValue({ rol: 'ADMINISTRADOR', nombreCompleto: 'Admin Test' })
    };

    routerSpy = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [EspecialidadesComponent],
      providers: [
        { provide: EspecialidadService, useValue: especialidadServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EspecialidadesComponent);
    component = fixture.componentInstance;
  });

  it('debe crearse exitosamente y cargar la lista de especialidades', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(especialidadServiceSpy.getEspecialidades).toHaveBeenCalled();
    expect(component.especialidades.length).toBe(3);
  });

  it('debe redirigir a / si el usuario no posee rol ADMINISTRADOR', () => {
    authServiceSpy.hasRole.mockReturnValue(false);
    component.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('debe filtrar reactivamente las especialidades por término de búsqueda en nombre o descripción', () => {
    fixture.detectChanges();
    component.filtroTexto = 'cardio';
    expect(component.especialidadesFiltradas.length).toBe(1);
    expect(component.especialidadesFiltradas[0].nombre).toBe('Cardiología');

    component.filtroTexto = 'infantil';
    expect(component.especialidadesFiltradas.length).toBe(1);
    expect(component.especialidadesFiltradas[0].nombre).toBe('Pediatría');

    component.limpiarFiltro();
    expect(component.especialidadesFiltradas.length).toBe(3);
  });

  it('debe abrir modal en modo alta con formulario limpio', () => {
    component.abrirModalCrear();
    expect(component.modalAbierto).toBe(true);
    expect(component.modoEdicion).toBe(false);
    expect(component.especialidadSeleccionadaId).toBeNull();
    expect(component.especialidadForm.get('nombre')?.value).toBe('');
    expect(component.especialidadForm.get('descripcion')?.value).toBe('');
  });

  it('debe abrir modal en modo edición con los datos de la especialidad seleccionada', () => {
    const especialidad = mockEspecialidades[0];
    component.abrirModalEditar(especialidad);

    expect(component.modalAbierto).toBe(true);
    expect(component.modoEdicion).toBe(true);
    expect(component.especialidadSeleccionadaId).toBe(1);
    expect(component.especialidadForm.get('nombre')?.value).toBe('Cardiología');
    expect(component.especialidadForm.get('descripcion')?.value).toBe('Diagnóstico y tratamiento cardiovascular');
  });

  it('debe validar que el nombre sea obligatorio y tenga al menos 3 caracteres', () => {
    const nombreCtrl = component.especialidadForm.get('nombre');

    nombreCtrl?.setValue('');
    expect(nombreCtrl?.valid).toBe(false);
    expect(nombreCtrl?.errors?.['required']).toBeTruthy();

    nombreCtrl?.setValue('AB');
    expect(nombreCtrl?.valid).toBe(false);
    expect(nombreCtrl?.errors?.['minlength']).toBeTruthy();

    nombreCtrl?.setValue('Dermatología');
    expect(nombreCtrl?.valid).toBe(true);
  });

  it('debe validar longitud máxima de 500 caracteres en la descripción y calcular contador', () => {
    const descCtrl = component.especialidadForm.get('descripcion');
    descCtrl?.setValue('Breve descripción');
    expect(component.descripcionLength).toBe(17);

    descCtrl?.setValue('a'.repeat(501));
    expect(descCtrl?.valid).toBe(false);
    expect(descCtrl?.errors?.['maxlength']).toBeTruthy();
    expect(component.descripcionLength).toBe(501);
  });

  it('debe dar de alta una nueva especialidad con éxito y recargar la grilla', () => {
    const nuevaEspecialidad: Especialidad = { id: 4, nombre: 'Neurología', descripcion: 'Sistema nervioso' };
    especialidadServiceSpy.crearEspecialidad.mockReturnValue(of(nuevaEspecialidad));

    component.abrirModalCrear();
    component.especialidadForm.setValue({
      nombre: 'Neurología',
      descripcion: 'Sistema nervioso'
    });

    component.guardarEspecialidad();

    expect(especialidadServiceSpy.crearEspecialidad).toHaveBeenCalledWith({
      nombre: 'Neurología',
      descripcion: 'Sistema nervioso'
    });
    expect(component.modalAbierto).toBe(false);
    expect(component.mensajeExito).toContain('dada de alta exitosamente');
    expect(especialidadServiceSpy.getEspecialidades).toHaveBeenCalledTimes(1);
  });

  it('debe actualizar una especialidad existente con éxito y recargar la grilla', () => {
    const especialidadActualizada: Especialidad = { id: 1, nombre: 'Cardiología Adultos', descripcion: 'Nueva desc' };
    especialidadServiceSpy.actualizarEspecialidad.mockReturnValue(of(especialidadActualizada));

    component.abrirModalEditar(mockEspecialidades[0]);
    component.especialidadForm.setValue({
      nombre: 'Cardiología Adultos',
      descripcion: 'Nueva desc'
    });

    component.guardarEspecialidad();

    expect(especialidadServiceSpy.actualizarEspecialidad).toHaveBeenCalledWith(1, {
      nombre: 'Cardiología Adultos',
      descripcion: 'Nueva desc'
    });
    expect(component.modalAbierto).toBe(false);
    expect(component.mensajeExito).toContain('actualizada exitosamente');
  });

  it('debe capturar error 409 Conflict ante nombre duplicado y mostrar alerta sin cerrar modal', () => {
    const error409 = new HttpErrorResponse({
      status: 409,
      error: { message: 'Ya existe una especialidad médica registrada con el nombre: Cardiología' }
    });
    especialidadServiceSpy.crearEspecialidad.mockReturnValue(throwError(() => error409));

    component.abrirModalCrear();
    component.especialidadForm.setValue({
      nombre: 'Cardiología',
      descripcion: 'Cualquier descripción'
    });

    component.guardarEspecialidad();

    expect(component.guardando).toBe(false);
    expect(component.modalAbierto).toBe(true);
    expect(component.mensajeErrorModal).toContain('Ya existe una especialidad médica registrada con el nombre: Cardiología');
  });

  it('debe cerrar el modal al presionar la tecla Escape', () => {
    component.abrirModalCrear();
    expect(component.modalAbierto).toBe(true);

    component.onEscapePress();
    expect(component.modalAbierto).toBe(false);
  });
});
