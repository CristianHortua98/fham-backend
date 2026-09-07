import { join } from 'path';

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';

import { ProductsModule } from './products/products.module';
import { CommonModule } from './common/common.module';
import { SeedModule } from './seed/seed.module';
import { FilesModule } from './files/files.module';
import { AuthModule } from './auth/auth.module';
import { MessagesWsModule } from './messages-ws/messages-ws.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        database: config.get('DB_NAME'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        ssl: config.get('STAGE') === 'prod',
        extra:
          config.get('STAGE') === 'prod'
            ? { ssl: { rejectUnauthorized: false } }
            : {},
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    // ServeStaticModule.forRoot({
    //   rootPath: join(__dirname,'..','public'), 
    // }),

    ProductsModule,

    CommonModule,

    FilesModule,

    AuthModule,

    MessagesWsModule,

  ],
})
export class AppModule {}
