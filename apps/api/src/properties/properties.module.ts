import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';
import { SearchService } from './search.service';
import { FraudModule } from '../fraud/fraud.module';

@Module({
  imports: [FraudModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, SearchService],
  exports: [PropertiesService, SearchService],
})
export class PropertiesModule {}
