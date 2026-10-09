import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginMedicoComponent } from './login-medico';

describe('LoginMedicoComponent', () => {
  let component: LoginMedicoComponent;
  let fixture: ComponentFixture<LoginMedicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginMedicoComponent]
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