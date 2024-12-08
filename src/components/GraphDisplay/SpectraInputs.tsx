import {
  Stack,
  Button,
  TextInput,
  Slider,
  Checkbox,
  Group,
  Text,
  Select,
  Drawer,
  Collapse,
  Card,
  Title,
} from '@mantine/core';
import { useState, useEffect } from 'react';
import { useAppContext } from '../AppLayout';
import { IconEdit, IconTrash, IconChevronUp, IconChevronDown } from '@tabler/icons-react';

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
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const { entries, setEntries } = useAppContext();
  const { spectralDB, submitSwitch, setSubmitSwitch, setFetchTrigger } = useAppContext();
  const [collapsedEntries, setCollapsedEntries] = useState(entries.map(() => false));
  const [entryNames, setEntryNames] = useState(entries.map(() => 'New OCS'));
  const [isEditingName, setIsEditingName] = useState(entries.map(() => false));

  // Update dropdown options when spectralDB changes
  useEffect(() => {
    if (spectralDB) {
      const options = Object.keys(spectralDB);
      setDropdownOptions(options);
    }
  }, [spectralDB]);

  // Add a default entry if entries are empty
  useEffect(() => {
    if (entries.length === 0) {
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
      setEntryNames(['New OCS']);
    }
  }, [entries, setEntries]);

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

    // Update entry name with species name
    if (value) {
      setEntryNames(prev => {
        const newNames = [...prev];
        newNames[index] = value;
        return newNames;
      });
    }
  };

  // Handle name change
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = event.target;
    setEntryNames(prev => {
      const newNames = [...prev];
      newNames[index] = value;
      return newNames;
    });
  };

  // Toggle name editing
  const toggleEditingName = (index: number) => {
    setIsEditingName(prev => {
      const newEditing = [...prev];
      newEditing[index] = !newEditing[index];
      return newEditing;
    });
  };

  // Delete an entry
  const handleDeleteEntry = (index: number) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
    setCollapsedEntries(prev => prev.filter((_, i) => i !== index));
    setEntryNames(prev => prev.filter((_, i) => i !== index));
    setIsEditingName(prev => prev.filter((_, i) => i !== index));
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
    <form onSubmit={handleSubmit}>
      {/* Submit and Add Entry buttons at the top */}
      <Group position="apart" mb="md">
        <Button type="submit">Submit</Button>
        <Button
          variant="default"
          onClick={() => {
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
            ]);
            setEntryNames([...entryNames, 'New OCS']);
          }}
        >
          Add Entry
        </Button>
      </Group>

      {/* Entries stack */}
      <Stack spacing="xl">
        {entries.map((entry, index) => (
          <Card key={index} padding="lg" style={{ backgroundColor: '#f5f5f7' }}>
            <Group position="apart" align="center">
              {isEditingName[index] ? (
                <TextInput
                  value={entryNames[index]}
                  onChange={e => handleNameChange(e, index)}
                  onBlur={() => toggleEditingName(index)}
                  styles={{ input: { fontSize: '1.25rem', fontWeight: 500 } }}
                />
              ) : (
                <Title order={4} style={{ color: '#1d1d1f' }}>
                  {entryNames[index]}
                </Title>
              )}
              <Group spacing="xs" style={{ marginLeft: 'auto' }}>
                <Button variant="subtle" compact onClick={() => toggleEditingName(index)}>
                  <IconEdit size={16} />
                </Button>
                <Button variant="subtle" compact onClick={() => handleDeleteEntry(index)}>
                  <IconTrash size={16} />
                </Button>
                <Button
                  variant="subtle"
                  compact
                  onClick={() =>
                    setCollapsedEntries(prev => {
                      const newCollapsed = [...prev];
                      newCollapsed[index] = !newCollapsed[index];
                      return newCollapsed;
                    })
                  }
                >
                  {collapsedEntries[index] ? <IconChevronDown size={16} /> : <IconChevronUp size={16} />}
                </Button>
              </Group>
            </Group>
            <Collapse in={!collapsedEntries[index]}>
              {/* Species Selection */}
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
                mb="md"
              />

              {/* Wavelength Bounds Inputs */}
              <Group grow mb="md">
                <TextInput
                  label="Min Wavelength"
                  name="min"
                  type="number"
                  value={entry.wavelengthBounds.min}
                  onChange={e => handleBoundsInputChange(e, index)}
                  required
                />
                <TextInput
                  label="Max Wavelength"
                  name="max"
                  type="number"
                  value={entry.wavelengthBounds.max}
                  onChange={e => handleBoundsInputChange(e, index)}
                  required
                />
              </Group>

              {/* Spectral Peaks and Active Cones */}
              <Text weight={500} size="md" mb="sm">
                Spectral Peaks (nm)
              </Text>
              {(['isCone1Active', 'isCone2Active', 'isCone3Active', 'isCone4Active'] as const).map(
                (coneKey, coneIndex) => (
                  <Group key={coneKey} position="apart" mb="sm">
                    <Text size="sm" style={{ minWidth: '60px' }}>
                      {`Cone ${coneIndex + 1}`}
                    </Text>
                    <Slider
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
            </Collapse>
          </Card>
        ))}
      </Stack>
    </form>
  );
}