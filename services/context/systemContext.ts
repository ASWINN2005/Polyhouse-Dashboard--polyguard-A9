export type SystemContext = {
  sensors: {
    temperature: number;
    humidity: number;
    soilMoisture: number;
    lightIntensity: number;
    status: "active" | "inactive";
  };

  actuators: {
    waterPump: "on" | "off";
    ventilation: "on" | "off";
    growLights: "on" | "off";
    shadeNet: "open" | "closed";
    mode: "auto" | "manual";
  };

  environment: {
    outsideTemp?: number;
    outsideHumidity?: number;
    wind?: number;
    forecast?: {
      tomorrow?: string;
      nextDays?: string[];
    };
  };

  system: {
    time: string;
    date: string;
    location?: string;
    demoMode: boolean;
    latencyMs?: number;
  };

  analytics: {
    trendsAvailable: boolean;
  };
};
