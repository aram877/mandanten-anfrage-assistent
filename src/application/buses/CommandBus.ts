import { Command, CommandType } from '@domain/commands';

export type CommandHandler<C extends Command> = (command: C) => Promise<void>;

export class CommandBus {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly handlers = new Map<CommandType, CommandHandler<any>>();

  register<C extends Command>(type: CommandType, handler: CommandHandler<C>): void {
    this.handlers.set(type, handler);
  }

  async dispatch<C extends Command>(command: C): Promise<void> {
    const handler = this.handlers.get(command.type);
    if (!handler) {
      throw new Error(`No handler registered for command type: ${command.type}`);
    }
    return handler(command);
  }
}
