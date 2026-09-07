import { Module, Global } from '@nestjs/common';
import { FraudDetectorService } from './services/fraud-detector.service';

@Global()
@Module({
  providers: [FraudDetectorService],
  exports: [FraudDetectorService],
})
export class CommonModule {}
