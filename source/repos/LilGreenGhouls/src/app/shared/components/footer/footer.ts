import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class FooterComponent implements OnInit, OnDestroy {
  protected readonly currentYear = new Date().getFullYear();

  readonly bangersList = [
    { name: 'Hobo-Core', quote: 'She Ho on my Bo til I Bindle' },
    { name: 'Brook', quote: 'Call me a brook the way I babble' },
    { name: 'Zoloft', quote: 'Me and my girl splitting a Zoloft, Lady and the Tramp style' },
    { name: 'Cat Spin', quote: '*pointing at the cat in my washing machine* my friends in there :)' },
    { name: 'Enemy', quote: 'Asking for an enemy?' },
    { name: 'Sarah-ism', quote: 'Poor as buttons, Rich as silk' },
    { name: 'highschool', quote: 'yeah, I plateaued in high school' },
    { name: 'unc', quote: 'Ive got an unc soul' },
    { name: 'Megan', quote: 'Megan Fox line of Crocs called Megan Crox...is this anything?' },
    { name: 'Borat', quote: 'Italian Borat be like, "Mi Moglie!"' },
  ];

  readonly bangerCount = this.bangersList.length;

  protected readonly randomBanger = signal(this.pickRandomBanger());

  private rotationTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.rotationTimer = setInterval(() => {
      this.randomBanger.set(this.pickRandomBanger());
    }, 3 * 60 * 1000);
  }

  ngOnDestroy(): void {
    if (this.rotationTimer) {
      clearInterval(this.rotationTimer);
    }
  }

  private pickRandomBanger(): string {
    const randomIndex = Math.floor(Math.random() * this.bangersList.length);
    return this.bangersList[randomIndex].quote;
  }
}
