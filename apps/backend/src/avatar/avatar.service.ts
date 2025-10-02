import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateAvatarDto } from './dto/create-avatar.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

export interface Avatar {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  voiceSettings?: {
    pitch: number;
    speed: number;
    volume: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AvatarService {
  private avatars: Avatar[] = [];
  private nextId = 1;

  create(createAvatarDto: CreateAvatarDto): Avatar {
    const avatar: Avatar = {
      id: this.nextId.toString(),
      ...createAvatarDto,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.avatars.push(avatar);
    this.nextId++;
    return avatar;
  }

  findAll(): Avatar[] {
    return this.avatars;
  }

  findOne(id: string): Avatar {
    const avatar = this.avatars.find(avatar => avatar.id === id);
    if (!avatar) {
      throw new NotFoundException(`Avatar with ID ${id} not found`);
    }
    return avatar;
  }

  update(id: string, updateAvatarDto: UpdateAvatarDto): Avatar {
    const avatarIndex = this.avatars.findIndex(avatar => avatar.id === id);
    if (avatarIndex === -1) {
      throw new NotFoundException(`Avatar with ID ${id} not found`);
    }

    this.avatars[avatarIndex] = {
      ...this.avatars[avatarIndex],
      ...updateAvatarDto,
      updatedAt: new Date(),
    };

    return this.avatars[avatarIndex];
  }

  remove(id: string): { message: string } {
    const avatarIndex = this.avatars.findIndex(avatar => avatar.id === id);
    if (avatarIndex === -1) {
      throw new NotFoundException(`Avatar with ID ${id} not found`);
    }

    this.avatars.splice(avatarIndex, 1);
    return { message: `Avatar with ID ${id} has been deleted` };
  }

  async speak(id: string, text: string): Promise<{ message: string; audioUrl?: string }> {
    const avatar = this.findOne(id);
    
    // In a real application, this would integrate with TTS services
    // For now, we'll simulate the speaking functionality
    return {
      message: `Avatar "${avatar.name}" is speaking: "${text}"`,
      audioUrl: `https://example.com/audio/${id}-${Date.now()}.mp3`,
    };
  }
}
