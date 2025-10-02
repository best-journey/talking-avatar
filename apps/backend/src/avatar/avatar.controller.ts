import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { AvatarService } from './avatar.service';
import { CreateAvatarDto } from './dto/create-avatar.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

@Controller('avatar')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @Post()
  async create(@Body() createAvatarDto: CreateAvatarDto) {
    return this.avatarService.create(createAvatarDto);
  }

  @Get()
  async findAll() {
    return this.avatarService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.avatarService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateAvatarDto: UpdateAvatarDto) {
    return this.avatarService.update(id, updateAvatarDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.avatarService.remove(id);
  }

  @Post(':id/speak')
  async speak(@Param('id') id: string, @Body() speakDto: { text: string }) {
    return this.avatarService.speak(id, speakDto.text);
  }
}
