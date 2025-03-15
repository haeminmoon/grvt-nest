import { Injectable, Logger } from "@nestjs/common";
import { GrvtApiConfig, GrvtEnvConfig, getEnvConfig } from "../grvt.config";
import axios, { AxiosInstance } from "axios";
import { SimpleCookie } from "set-cookie-parser";

interface GrvtCookie {
  gravity: string;
  expires: Date;
  grvtAccountId: string | null;
}

interface GrvtError {
  code: number;
  message: string;
  status: number;
}

@Injectable()
export class GrvtRawService {
  protected config: GrvtApiConfig;
  protected env: GrvtEnvConfig;
  protected logger: Logger;
  protected cookie: GrvtCookie | null = null;
  protected client: AxiosInstance;

  constructor(config: GrvtApiConfig) {
    this.config = config;
    this.env = getEnvConfig(config.env);
    this.logger = config.logger || new Logger(GrvtRawService.name);
    this.client = axios.create({
      headers: { "Content-Type": "application/json" },
    });
  }

  protected shouldRefreshCookie(): boolean {
    if (!this.config.apiKey) {
      throw new Error(
        "Attempting to use Authenticated API without API key set"
      );
    }

    let timeTillExpiration = null;
    if (this.cookie?.expires) {
      timeTillExpiration = this.cookie.expires.getTime() - Date.now();
    }

    const isCookieFresh =
      timeTillExpiration != null && timeTillExpiration > 5000;
    if (!isCookieFresh) {
      this.logger.debug(
        `cookie should be refreshed now=${Date.now()} timeTillExpiration=${timeTillExpiration}ms`
      );
    }
    return !isCookieFresh;
  }

  protected async refreshCookie(): Promise<void> {
    if (!this.shouldRefreshCookie()) {
      return;
    }

    this.cookie = await this.getCookie(
      this.env.edge.rpcEndpoint + "/auth/api_key/login",
      String(this.config.apiKey)
    );

    this.logger.debug(`refresh_cookie cookie=${JSON.stringify(this.cookie)}`);

    if (this.cookie) {
      this.client.defaults.headers.common[
        "Cookie"
      ] = `gravity=${this.cookie.gravity}`;
      if (this.cookie.grvtAccountId) {
        this.client.defaults.headers.common["X-Grvt-Account-Id"] =
          this.cookie.grvtAccountId;
      }
    }
  }

  protected async getCookie(
    path: string,
    apiKey: string
  ): Promise<GrvtCookie | null> {
    try {
      const response = await this.client.post(
        path,
        { api_key: apiKey },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.status === 200) {
        const cookieHeader = response.headers["set-cookie"];
        if (!cookieHeader) return null;

        const cookies = SimpleCookie.parse(cookieHeader[0]);
        const gravityCookie = cookies.find((c) => c.name === "gravity");
        if (!gravityCookie) return null;

        return {
          gravity: gravityCookie.value,
          expires: new Date(gravityCookie.expires),
          grvtAccountId: response.headers["x-grvt-account-id"] || null,
        };
      }
      return null;
    } catch (e) {
      this.logger.error(`Error getting cookie: ${e}`);
      return null;
    }
  }

  protected async post<T>(
    isAuth: boolean,
    path: string,
    req: any
  ): Promise<T | GrvtError> {
    if (isAuth) {
      await this.refreshCookie();
    }

    try {
      const response = await this.client.post(path, req);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data) {
        this.logger.warn(`Error ${JSON.stringify(error.response.data)}`);
        return error.response.data;
      }
      this.logger.error(`Unable to parse response: ${error}`);
      return {
        code: 500,
        message: "Internal server error",
        status: 500,
      };
    }
  }
}
