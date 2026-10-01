import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "./auth/auth.module.js";
import { HealthController } from "./health.controller.js";
import { MonitorsModule } from "./monitors/monitors.module.js";
import { ObservationsModule } from "./observations/observations.module.js";
import { PresencesModule } from "./presences/presences.module.js";
import { RoomsModule } from "./rooms/rooms.module.js";
import { SupabaseModule } from "./supabase/supabase.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env"],
    }),
    SupabaseModule,
    AuthModule,
    RoomsModule,
    MonitorsModule,
    PresencesModule,
    ObservationsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
