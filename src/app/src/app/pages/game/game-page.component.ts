import { Component } from '@angular/core';
import { LevelComponent } from '../../shared/components/level/level.component';

@Component({
    selector: 'dd-game-page',
    imports: [LevelComponent],
    templateUrl: './game-page.component.html',
    styleUrl: './game-page.component.scss'
})
export class GamePageComponent {
}
