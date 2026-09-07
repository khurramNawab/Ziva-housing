import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { SearchService } from './search.service';

@Module({
  controllers: [PropertiesController],
  providers: [PropertiesService, SearchService],
  exports: [PropertiesService, SearchService],
})
export class PropertiesModule {}
