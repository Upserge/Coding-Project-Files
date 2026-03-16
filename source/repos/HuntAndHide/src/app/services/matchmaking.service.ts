import { inject, Injectable } from '@angular/core';
import { GameSession } from '../models/session.model';
import { PlayerState } from '../models/player.model';
import { PlayerService } from './player.service';
import { SessionService } from './session.service';

@Injectable({ providedIn: 'root' })
export class MatchmakingService {
  private readonly sessionService = inject(SessionService);
  private readonly playerService = inject(PlayerService);

  async joinLobby(): Promise<string> {
    await this.sessionService.removePlayerFromAllSessions();
    return (await this.joinExistingLobby()) ?? this.createLobby();
  }

  private async joinExistingLobby(): Promise<string | undefined> {
    const sessionIds = await this.sessionService.findJoinableSessionIds();

    for (const sessionId of sessionIds) {
      const player = await this.sessionService.tryJoinSession(
        sessionId,
        session => this.buildPlayer(session),
      );
      if (!player) continue;
      return sessionId;
    }

    return undefined;
  }

  private async createLobby(): Promise<string> {
    const sessionId = await this.sessionService.createSession();
    const player = await this.sessionService.tryJoinSession(
      sessionId,
      session => this.buildPlayer(session),
    );

    if (player) return sessionId;
    throw new Error('Failed to join a newly created lobby.');
  }

  private buildPlayer(session: GameSession): PlayerState {
    const takenAnimals = Object.values(session.players ?? {}).filter(Boolean).map(player => player.animal);
    const role = this.playerService.assignRole(session.hiderCount ?? 0, session.hunterCount ?? 0);
    const animal = this.playerService.assignAnimal(role, takenAnimals);
    return this.playerService.createPlayerState(role, animal, { x: 0, y: 0, z: 0 });
  }
}
