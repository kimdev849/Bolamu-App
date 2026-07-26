import { Directive, ElementRef, EventEmitter, inject, OnDestroy, Output } from '@angular/core';

@Directive({
  selector: '[psrClickOutside]',
})
export class ClickOutside implements OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly listener: (event: MouseEvent) => void;

  @Output() readonly psrClickOutside = new EventEmitter<void>();

  constructor() {
    this.listener = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target && !this.elementRef.nativeElement.contains(target)) {
        this.psrClickOutside.emit();
      }
    };
    document.addEventListener('click', this.listener);
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.listener);
  }
}
