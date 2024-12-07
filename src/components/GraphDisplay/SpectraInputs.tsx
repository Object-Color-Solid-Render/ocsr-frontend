import {
  Stack,
  Button,
  TextInput,
  Slider,
  Checkbox,
  Group,
  Text,
  Select,
} from '@mantine/core';
import { useState, useEffect } from 'react';
import DropdownContent from '../Dropdown/DropdownContent';
import DropdownButton from '../Dropdown/DropdownButton';
import { useAppContext } from '../AppLayout';

// Type definitions
export type EntryParams = {
  wavelengthBounds: { min: number; max: number };
  omitBetaBand: boolean;
  isMaxBasis: boolean;
  wavelengthSampleResolution: number;
  spectralPeaks: {
    peakWavelength1: number;
    peakWavelength2: number;
    peakWavelength3: number;
    peakWavelength4: number;
  };
  activeCones: {
    isCone1Active: boolean;
    isCone2Active: boolean;
    isCone3Active: boolean;
    isCone4Active: boolean;
  };
  selectedSpecies: string | null;
};

export default function SpectraInputs() {
  const [open, setOpen] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const { entries, setEntries } = useAppContext();
  const { spectralDB, submitSwitch, setSubmitSwitch, setFetchTrigger } = useAppContext();

  // Update dropdown options when spectralDB changes
  useEffect(() => {
    if (spectralDB) {
      const options = Object.keys(spectralDB);
      setDropdownOptions(options);
    }
  }, [spectralDB]);

  // Add a default entry on component mount
  useEffect(() => {
    const defaultEntry: EntryParams = {
      wavelengthBounds: { min: 390, max: 700 },
      omitBetaBand: true,
      isMaxBasis: false,
      wavelengthSampleResolution: 20,
      spectralPeaks: {
        peakWavelength1: 455,
        peakWavelength2: 543,
        peakWavelength3: 566,
        peakWavelength4: 560,
      },
      activeCones: {
        isCone1Active: true,
        isCone2Active: true,
        isCone3Active: true,
        isCone4Active: false,
      },
      selectedSpecies: null,
    };
    setEntries([defaultEntry]);
  }, [setEntries]);

  // Handle changes to spectral peaks
  const handleSpectralPeaksChange = (
    name: keyof EntryParams['spectralPeaks'],
    value: number,
    index: number
  ) => {
    setEntries(prev => {
      const newEntries = [...prev];
      newEntries[index].spectralPeaks[name] = value;
      return newEntries;
    });
  };

  // Handle toggling of active cones
  const handleActiveConesChange = (
    name: keyof EntryParams['activeCones'],
    index: number
  ) => {
    setEntries(prev => {
      const newEntries = [...prev];
      newEntries[index].activeCones[name] = !newEntries[index].activeCones[name];
      return newEntries;
    });
  };

  // Handle changes to wavelength bounds
  const handleBoundsInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const { name, value } = event.target;
    setEntries(prev => {
      const newEntries = [...prev];
      newEntries[index].wavelengthBounds[name as 'min' | 'max'] = Number(value);
      return newEntries;
    });
  };

  // Handle changes to selected species
  const handleSpeciesChange = (value: string | null, index: number) => {
    setEntries(prev => {
      const newEntries = [...prev];
      newEntries[index].selectedSpecies = value;
      if (value && spectralDB[value]) {
        const peaks = spectralDB[value].peaks;
        const newPeaks = {
          peakWavelength1: peaks[0],
          peakWavelength2: peaks[1],
          peakWavelength3: peaks[2],
          peakWavelength4: peaks[3],
        };
        newEntries[index].spectralPeaks = newPeaks;
        newEntries[index].activeCones = {
          isCone1Active: peaks[0] !== 0,
          isCone2Active: peaks[1] !== 0,
          isCone3Active: peaks[2] !== 0,
          isCone4Active: peaks[3] !== 0,
        };
      }
      return newEntries;
    });
  };

  // Handle form submission
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (entries.length > 0) {
      setFetchTrigger(true);
      setSubmitSwitch(-1 * submitSwitch);
    }
  };

  return (
    <div>
      <DropdownButton open={open} setOpen={setOpen} leftDropdown={false} />
      <DropdownContent open={open} width={400}>
        <Stack gap="m">
          <Button
            onClick={() =>
              setEntries([
                ...entries,
                {
                  wavelengthBounds: { min: 390, max: 700 },
                  omitBetaBand: true,
                  isMaxBasis: false,
                  wavelengthSampleResolution: 20,
                  spectralPeaks: {
                    peakWavelength1: 455,
                    peakWavelength2: 543,
                    peakWavelength3: 566,
                    peakWavelength4: 560,
                  },
                  activeCones: {
                    isCone1Active: true,
                    isCone2Active: true,
                    isCone3Active: true,
                    isCone4Active: false,
                  },
                  selectedSpecies: null,
                },
              ])
            }
          >
            Add Entry
          </Button>
          <form onSubmit={handleSubmit}>
            {entries.map((entry, index) => (
              <div key={index}>
                <Text weight={500} size="md" mb="sm">
                  Select Species
                </Text>
                <Select
                  placeholder="Select a species"
                  data={dropdownOptions}
                  value={entry.selectedSpecies}
                  onChange={value => handleSpeciesChange(value, index)}
                  searchable
                  nothingFound="No species found"
                  dropdownPosition="bottom"
                  style={{ marginBottom: '16px' }}
                />

                {/* Wavelength Bounds Inputs */}
                <TextInput
                  label="Minimum Wavelength"
                  placeholder="Minimum Wavelength"
                  name="min"
                  type="number"
                  value={entry.wavelengthBounds.min}
                  onChange={e => handleBoundsInputChange(e, index)}
                  required
                />
                <TextInput
                  label="Maximum Wavelength"
                  placeholder="Maximum Wavelength"
                  name="max"
                  type="number"
                  value={entry.wavelengthBounds.max}
                  onChange={e => handleBoundsInputChange(e, index)}
                  required
                />

                {/* Spectral Peaks and Active Cones */}
                <Text weight={500} size="md" mb="sm">
                  Spectral Peaks (nm)
                </Text>
                {(['isCone1Active', 'isCone2Active', 'isCone3Active', 'isCone4Active'] as const).map(
                  (coneKey, coneIndex) => (
                    <Group key={coneKey} position="apart" mb="sm">
                      <Text size="sm" style={{ minWidth: '0px' }}>
                        {`${entry.spectralPeaks[
                          `peakWavelength${coneIndex + 1}` as keyof EntryParams['spectralPeaks']
                        ] || 'N/A'} nm`}
                      </Text>
                      <Slider
                        label={null}
                        value={
                          entry.spectralPeaks[
                            `peakWavelength${coneIndex + 1}` as keyof EntryParams['spectralPeaks']
                          ]
                        }
                        onChange={value =>
                          handleSpectralPeaksChange(
                            `peakWavelength${coneIndex + 1}` as keyof EntryParams['spectralPeaks'],
                            value,
                            index
                          )
                        }
                        min={380}
                        max={700}
                        step={1}
                        disabled={!entry.activeCones[coneKey]}
                        style={{ flexGrow: 1 }}
                      />
                      <Checkbox
                        checked={entry.activeCones[coneKey]}
                        onChange={() => handleActiveConesChange(coneKey, index)}
                      />
                    </Group>
                  )
                )}

                {/* Max Basis Checkbox */}
                <Checkbox
                  label="Max Basis"
                  checked={entry.isMaxBasis}
                  onChange={event =>
                    setEntries(prev => {
                      const newEntries = [...prev];
                      newEntries[index].isMaxBasis = event.currentTarget.checked;
                      return newEntries;
                    })
                  }
                  mb="sm"
                />
              </div>
            ))}
            <Button type="submit" fullWidth>
              Submit
            </Button>
          </form>
        </Stack>
      </DropdownContent>
    </div>
  );
}