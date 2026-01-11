import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamInterface } from './exam-interface';

describe('ExamInterface', () => {
  let component: ExamInterface;
  let fixture: ComponentFixture<ExamInterface>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamInterface]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamInterface);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
