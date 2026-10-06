import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout';
import { AuthService } from '../../../services/auth';
import { describe, it, expect, beforeEach } from 'vitest';

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        AuthService,
        provideRouter([])
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse el shell layout administrativo exitosamente', () => {
    expect(component).toBeTruthy();
    expect(component.sedeSeleccionada).toBe('Hospital Central de Mendoza');
    expect(component.pendientesValidacion).toBe(14);
  });
});
