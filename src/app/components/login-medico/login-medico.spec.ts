import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginMedicoComponent } from './login-medico';

describe('LoginMedicoComponent', () => {
  let component: LoginMedicoComponent;
  let fixture: ComponentFixture<LoginMedicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginMedicoComponent],
      providers: [provideRouter([])]
    })
      .compileComponents();

    fixture = TestBed.createComponent(LoginMedicoComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});