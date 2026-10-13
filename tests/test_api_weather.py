"""AWC METAR and TAF as /api/weather fields (api/index.py `latest_weather`)."""
import importlib.util
from pathlib import Path

spec = importlib.util.spec_from_file_location("api_index", Path(__file__).parent.parent / "api" / "index.py")
api = importlib.util.module_from_spec(spec)
spec.loader.exec_module(api)


def metar(obs_time, **extra):
    return {"icaoId": "VHHH", "obsTime": obs_time, "rawOb": f"METAR VHHH {obs_time}", "temp": 30, "dewp": 23,
            "wdir": 270, "wspd": 6, "visib": 4.97, "altim": 1016, "fltCat": "MVFR",
            "clouds": [{"cover": "FEW", "base": 2000}], **extra}


def test_newest_metar_for_the_airport_only():
    m, _ = api.latest_weather("VHHH", [metar(1791865800), metar(1791867600),
                                       {**metar(1791869400), "icaoId": "YSSY"}], [])
    assert m["metar_observed_at"] == "2026-10-13T05:00:00+00:00"
    assert m["metar_raw"] == "METAR VHHH 1791867600"
    assert (m["wind_dir_deg"], m["wind_speed_kt"], m["wind_gust_kt"], m["wind_variable"]) == (270, 6, None, False)
    assert (m["temp_c"], m["dewpoint_c"], m["altimeter_hpa"], m["flight_category"]) == (30, 23, 1016, "MVFR")
    assert m["visibility_sm"] == 4.97 and not m["visibility_is_lower_bound"]
    assert m["ceiling_ft"] is None and m["wx_string"] is None


def test_variable_wind_lower_bound_visibility_and_ceiling():
    m, _ = api.latest_weather("VHHH", [metar(1791865800, wdir="VRB", wspd=3, wgst=15, visib="6+", wxString="-SHRA",
                                             clouds=[{"cover": "FEW", "base": 800}, {"cover": "OVC", "base": 3000},
                                                     {"cover": "BKN", "base": 1400}])], [])
    assert m["wind_variable"] and m["wind_dir_deg"] is None and m["wind_gust_kt"] == 15
    assert m["visibility_sm"] == 6 and m["visibility_is_lower_bound"]
    assert m["ceiling_ft"] == 1400
    assert m["wx_string"] == "-SHRA"


def test_newest_taf_and_nothing_when_empty():
    tafs = [{"icaoId": "VHHH", "issueTime": "2026-10-13T02:23:00.000Z", "validTimeFrom": 1791860400,
             "validTimeTo": 1791957600, "rawTAF": "TAF AMD VHHH new"},
            {"icaoId": "VHHH", "issueTime": "2026-10-12T23:00:00.000Z", "validTimeFrom": 1791849600,
             "validTimeTo": 1791957600, "rawTAF": "TAF VHHH old"}]
    m, t = api.latest_weather("VHHH", [], tafs)
    assert m is None
    assert t == {"taf_issued_at": "2026-10-13T02:23:00+00:00", "taf_valid_from": "2026-10-13T03:00:00+00:00",
                 "taf_valid_to": "2026-10-14T06:00:00+00:00", "taf_raw": "TAF AMD VHHH new"}
    assert api.latest_weather("VHHH", [], []) == (None, None)


def test_open_meteo_current_conditions():
    payload = {"current": {"time": 1791867600, "interval": 900, "temperature_2m": 19.1, "apparent_temperature": 17.6,
                           "relative_humidity_2m": 78, "dew_point_2m": 15.2, "precipitation": 0.2, "weather_code": 61,
                           "cloud_cover": 97, "pressure_msl": 1015.9, "wind_speed_10m": 11.8,
                           "wind_direction_10m": 162, "wind_gusts_10m": 27.8, "is_day": 1}}
    assert api.local_fields(payload) == {
        "observed_at": "2026-10-13T05:00:00+00:00", "conditions": "Light rain", "weather_code": 61, "is_day": True,
        "temp_c": 19.1, "feels_like_c": 17.6, "humidity_pct": 78, "dewpoint_c": 15.2, "precipitation_mm": 0.2,
        "cloud_cover_pct": 97, "pressure_hpa": 1015.9, "wind_dir_deg": 162, "wind_speed_kt": 12, "wind_gust_kt": 28}
    assert api.local_fields({"current": {"time": 1791867600, "weather_code": 42}})["conditions"] is None
    assert api.local_fields({}) is None
