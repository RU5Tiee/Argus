from pydantic import BaseModel

class RegisterMapping(BaseModel):
    iec_address: str
    modbus_address: int
    modbus_type: str # "COIL", "HOLDING_REGISTER"
    component: str
    description: str
    unit: str
    scale_factor: float = 1.0

MODBUS_MEMORY_MAP = {
    "%QX0.0": RegisterMapping(
        iec_address="%QX0.0",
        modbus_address=0,
        modbus_type="COIL",
        component="V-101",
        description="Inlet Feed Solenoid Valve",
        unit="Boolean"
    ),
    "%QX0.1": RegisterMapping(
        iec_address="%QX0.1",
        modbus_address=1,
        modbus_type="COIL",
        component="M-201",
        description="Agitator / Coolant Pump Motor",
        unit="Boolean"
    ),
    "%QX0.2": RegisterMapping(
        iec_address="%QX0.2",
        modbus_address=2,
        modbus_type="COIL",
        component="HTR-101",
        description="Electrical Heating Jacket",
        unit="Boolean"
    ),
    "%QX0.3": RegisterMapping(
        iec_address="%QX0.3",
        modbus_address=3,
        modbus_type="COIL",
        component="RV-101",
        description="Emergency Relief Valve",
        unit="Boolean"
    ),
    "%QW0.0": RegisterMapping(
        iec_address="%QW0.0",
        modbus_address=0,
        modbus_type="HOLDING_REGISTER",
        component="TT-101",
        description="Reactor Core Temperature",
        unit="°C",
        scale_factor=10.0
    ),
    "%QW0.1": RegisterMapping(
        iec_address="%QW0.1",
        modbus_address=1,
        modbus_type="HOLDING_REGISTER",
        component="PT-101",
        description="Vessel Internal Pressure",
        unit="bar",
        scale_factor=100.0
    ),
    "%QW0.2": RegisterMapping(
        iec_address="%QW0.2",
        modbus_address=2,
        modbus_type="HOLDING_REGISTER",
        component="FT-101",
        description="Feed Inlet Flow Rate",
        unit="L/min",
        scale_factor=10.0
    ),
    "%QW0.3": RegisterMapping(
        iec_address="%QW0.3",
        modbus_address=3,
        modbus_type="HOLDING_REGISTER",
        component="LT-101",
        description="Vessel Liquid Level",
        unit="%",
        scale_factor=10.0
    ),
}
