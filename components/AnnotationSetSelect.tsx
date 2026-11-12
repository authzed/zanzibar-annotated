import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import {
  ChatBubbleLeftEllipsisIcon,
  CheckIcon,
  ChevronUpDownIcon,
} from '@heroicons/react/20/solid';
import { Fragment, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { AnnotationAuthor, useAnnotation } from './annotation';
import { gtag } from './GTag';
import { getAssetUrl } from '../util/siteconfig';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

type SelectItem = {
  value: string;
  label: string;
  description?: string;
  color?: string;
  author?: AnnotationAuthor;
};

// The picture of a set's author. The author's name is shown beside it, so it
// has no description of its own.
function Avatar(props: { author: AnnotationAuthor; className: string }) {
  return (
    // A plain image, since it's small and served as is.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${getAssetUrl()}${props.author.avatar}`}
      alt=""
      width={28}
      height={28}
      className={classNames('shrink-0 rounded-full', props.className)}
    />
  );
}

// Renders an item's markdown description inline. Links are shown as emphasized
// text rather than links since the description sits inside the select's button
// and options.
function Description(props: { children: string }) {
  return (
    <ReactMarkdown
      allowedElements={['p', 'a', 'em', 'strong']}
      unwrapDisallowed
      components={{
        p: ({ children }) => <>{children}</>,
        a: ({ children }) => (
          <span className="font-semibold text-gray-700">{children}</span>
        ),
      }}
    >
      {props.children}
    </ReactMarkdown>
  );
}

type SelectProps = {
  items: SelectItem[];
  default?: string;
  // Hides the selected set's author or description, leaving only its label.
  compact?: boolean;
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
    gtag('event', 'annotation_set_selected', {
      set_id: value.value,
    });
  };

  return (
    <Listbox value={selected} onChange={onChangeHandler}>
      {({ open }) => (
        <>
          <div className="relative inline-block">
            <ListboxButton
              aria-label={`Choose annotations: ${selected?.label ?? ''}`}
              className="relative flex items-center cursor-default rounded border border-gray-300 bg-white p-2.5 md:py-1 md:pl-3 md:pr-9 text-left focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-0"
            >
              {/* Phones show an icon in place of the selected set. */}
              <ChatBubbleLeftEllipsisIcon
                className="h-5 w-5 md:hidden"
                aria-hidden="true"
              />
              <span
                className={classNames(
                  selected?.color ? `bg-${selected?.color}-300` : '',
                  'absolute top-1.5 right-1.5 h-2 w-2 rounded-full md:static md:h-auto md:w-2 md:self-stretch md:rounded-sm md:mr-2 md:shrink-0'
                )}
              />
              {selected?.author && (
                <Avatar
                  author={selected.author}
                  className={classNames(
                    'hidden md:block mr-2 transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]',
                    props.compact ? 'h-5 w-5' : 'h-7 w-7'
                  )}
                />
              )}
              <span className="hidden md:flex flex-col w-52">
                <span className="truncate text-[13px] leading-4 font-semibold">
                  {selected?.label}
                </span>
                {/* The set's author, or its description if it has none,
                    collapses with the banner, animating a single grid row to
                    zero, so the button fits on one line. */}
                {(selected?.author || selected?.description) && (
                  <span
                    className={classNames(
                      'grid transition-all duration-500 ease-[cubic-bezier(0.33,1,0.68,1)]',
                      props.compact ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]'
                    )}
                  >
                    <span className="min-h-0 overflow-hidden text-[11px] leading-[14px] text-gray-500">
                      {selected.author ? (
                        <span className="block truncate pt-0.5">
                          {`by ${selected.author.name}`}
                        </span>
                      ) : (
                        <Description>{selected.description ?? ''}</Description>
                      )}
                    </span>
                  </span>
                )}
              </span>
              <span className="pointer-events-none absolute inset-y-0 right-0 ml-3 hidden md:flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5" aria-hidden="true" />
              </span>
            </ListboxButton>

            <Transition
              show={open}
              as={Fragment}
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <ListboxOptions className="absolute w-72 z-10 mt-1 max-h-80 overflow-auto rounded bg-white py-1 right-0 text-base shadow-md ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {props.items.map((item) => (
                  <ListboxOption
                    key={item.value}
                    className="text-black relative cursor-default select-none py-2 pl-3 pr-9"
                    value={item}
                  >
                    {({ selected }) => (
                      <>
                        <div className="flex">
                          <span
                            className={classNames(
                              item.color ? `bg-${item.color}-300` : '',
                              'block w-2 shrink-0 rounded-sm'
                            )}
                          />
                          <span className="ml-3 block">
                            <span
                              className={classNames(
                                selected ? 'font-semibold' : 'font-normal',
                                'block'
                              )}
                            >
                              {item.label}
                            </span>
                            {item.description && (
                              <span className="block mt-0.5 text-xs text-gray-500">
                                <Description>{item.description}</Description>
                              </span>
                            )}
                            {item.author && (
                              <span className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-700">
                                <Avatar
                                  author={item.author}
                                  className="h-5 w-5"
                                />
                                {item.author.name}
                              </span>
                            )}
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
                  </ListboxOption>
                ))}
              </ListboxOptions>
            </Transition>
          </div>
        </>
      )}
    </Listbox>
  );
}
