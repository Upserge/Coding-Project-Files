import { Component, output } from '@angular/core';

@Component({
  selector: 'app-credits-modal',
  standalone: true,
  templateUrl: './credits-modal.html',
  styleUrl: './credits-modal.css',
})
export class CreditsModalComponent {
  readonly closed = output<void>();

  close(): void {
    this.closed.emit();
  }
}
