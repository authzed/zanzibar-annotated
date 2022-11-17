import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid';
import { Fragment, useEffect, useState } from 'react';
import { useAnnotation } from './annotation';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

type SelectItem = {
  value: string;
  label: string;
  color?: string;
};

type SelectProps = {
  items: SelectItem[];
  default?: string;
};

// Adapted from https://tailwindui.com/components/application-ui/forms/select-menus
export default function AnnotationSetSelect(props: SelectProps) {
  const defaultItem = () =>
    props.items.find((item) => item.value === props.default);
  const [selected, setSelected] = useState<SelectItem | undefined>(defaultItem);
  const { activeAnnotationSetIds, toggleAnnotationSet } = useAnnotation();

  useEffect(() => {
    if (activeAnnotationSetIds.length === 1) {
      setSelected(
        props.items.find((item) => item.value === activeAnnotationSetIds[0])
      );
    }
  }, [props.items, activeAnnotationSetIds]);

  const onChangeHandler = (value: SelectItem) => {
    if (selected) {
      if (value.value === selected.value) return;
      toggleAnnotationSet(selected.value);
    }
    toggleAnnotationSet(value.value);
    setSelected(value);
  };

  return (
    <Listbox value={selected} onChange={onChangeHandler}>
      {({ open }) => (
        <>
          <div className="relative inline-block">
            <Listbox.Button className="relative cursor-default rounded border border-gray-300 bg-white py-2 pl-3 pr-10 text-left focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-0">
              <span
                className={classNames(
                  selected?.color ? `bg-${selected?.color}-300` : '',
                  'hidden lg:inline-block w-2 mr-2'
                )}
              >
                &nbsp;
              </span>
              <span className="truncate ">{selected?.label}</span>
              <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
              </span>
            </Listbox.Button>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute w-fit z-10 mt-1 max-h-56 overflow-auto rounded bg-white py-1 right-0 text-base shadow-md ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {props.items.map((item) => (
                  <Listbox.Option
                    key={item.value}
                    className="text-black relative cursor-default select-none py-2 pl-3 pr-9"
                    value={item}
                  >
                    {({ selected }) => (
                      <>
                        <div className="flex items-center">
                          <span
                            className={classNames(
                              item.color ? `bg-${item.color}-300` : '',
                              'block w-2'
                            )}
                          >
                            &nbsp;
                          </span>
                          <span
                            className={classNames(
                              selected ? 'font-semibold' : 'font-normal',
                              'ml-3 block truncate'
                            )}
                          >
                            {item.label}
                          </span>
                        </div>

                        {selected ? (
                          <span
                            className={
                              'text-black absolute inset-y-0 right-0 flex items-center pr-4'
                            }
                          >
                            <CheckIcon className="h-4 w-4" aria-hidden="true" />
                          </span>
                        ) : null}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
}
