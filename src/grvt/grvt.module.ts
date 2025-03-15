import { DynamicModule, Module } from "@nestjs/common";
import { GrvtApiConfig } from "./grvt.config";
import { GrvtRawService } from "./services/grvt-raw.service";
import { GrvtSigningService } from "./services/grvt-signing.service";

@Module({})
export class GrvtModule {
  static register(config: GrvtApiConfig): DynamicModule {
    return {
      module: GrvtModule,
      providers: [
        {
          provide: GrvtRawService,
          useFactory: () => new GrvtRawService(config),
        },
        {
          provide: GrvtSigningService,
          useFactory: () => new GrvtSigningService(config),
        },
      ],
      exports: [GrvtRawService, GrvtSigningService],
    };
  }
}
