import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AvatarService } from './avatar.service';
import { CreateAvatarDto } from './dto/create-avatar.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';

@ApiTags('Avatar')
@Controller('avatar')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new avatar' })
  @ApiResponse({ status: 201, description: 'Avatar created successfully' })
  async create(@Body() createAvatarDto: CreateAvatarDto) {
    return this.avatarService.create(createAvatarDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all avatars' })
  @ApiResponse({ status: 200, description: 'List of avatars' })
  async findAll() {
    return this.avatarService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get avatar by ID' })
  @ApiParam({ name: 'id', description: 'Avatar ID' })
  @ApiResponse({ status: 200, description: 'Avatar found' })
  @ApiResponse({ status: 404, description: 'Avatar not found' })
  async findOne(@Param('id') id: string) {
    return this.avatarService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update avatar' })
  @ApiParam({ name: 'id', description: 'Avatar ID' })
  @ApiResponse({ status: 200, description: 'Avatar updated successfully' })
  async update(@Param('id') id: string, @Body() updateAvatarDto: UpdateAvatarDto) {
    return this.avatarService.update(id, updateAvatarDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete avatar' })
  @ApiParam({ name: 'id', description: 'Avatar ID' })
  @ApiResponse({ status: 200, description: 'Avatar deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.avatarService.remove(id);
  }

  @Post(':id/speak')
  @ApiOperation({ summary: 'Make avatar speak' })
  @ApiParam({ name: 'id', description: 'Avatar ID' })
  @ApiResponse({ status: 200, description: 'Avatar speaking' })
  async speak(@Param('id') id: string, @Body() speakDto: { text: string }) {
    return this.avatarService.speak(id, speakDto.text);
  }
}
