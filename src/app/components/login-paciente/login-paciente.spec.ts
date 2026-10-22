import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginPacienteComponent } from './login-paciente';

describe('LoginPacienteComponent', () => {
  let component: LoginPacienteComponent;
  let fixture: ComponentFixture<LoginPacienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPacienteComponent],
      providers: [provideRouter([])]
    })
      .compileComponents();

    fixture = TestBed.createComponent(LoginPacienteComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
